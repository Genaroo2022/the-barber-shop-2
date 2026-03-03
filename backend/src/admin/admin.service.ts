import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ClientEntity } from '../entities/client.entity';
import { ServiceEntity } from '../entities/service.entity';
import { ManualIncomeEntryEntity } from '../entities/manual-income-entry.entity';
import { GalleryImageEntity } from '../entities/gallery-image.entity';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AppointmentStatus } from '../common/constants';
import { PhoneService } from '../common/phone.service';
import {
  AdminClientUpsertDto,
  AdminGalleryImageUpsertDto,
  AdminServiceUpsertDto,
  AdminUserCreateDto,
  AdminUserUpdateDto,
  CreateManualIncomeDto,
} from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepo: Repository<AppointmentEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientsRepo: Repository<ClientEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepo: Repository<ServiceEntity>,
    @InjectRepository(ManualIncomeEntryEntity)
    private readonly manualIncomeRepo: Repository<ManualIncomeEntryEntity>,
    @InjectRepository(GalleryImageEntity)
    private readonly galleryRepo: Repository<GalleryImageEntity>,
    @InjectRepository(AdminUserEntity)
    private readonly adminUsersRepo: Repository<AdminUserEntity>,
    private readonly phoneService: PhoneService,
  ) {}

  async listAppointments(month?: string, limit = 500, page = 0) {
    const qb = this.appointmentsRepo
      .createQueryBuilder('a')
      .innerJoin(ClientEntity, 'c', 'c.id = a.client_id')
      .innerJoin(ServiceEntity, 's', 's.id = a.service_id')
      .select([
        'a.id AS id',
        'a.client_id AS "clientId"',
        'c.name AS "clientName"',
        'c.phone AS "clientPhone"',
        'a.service_id AS "serviceId"',
        's.name AS "serviceName"',
        's.price AS "servicePrice"',
        'a.appointment_at AS "appointmentAt"',
        'a.status AS status',
        'a.notes AS notes',
      ])
      .orderBy('a.appointment_at', 'DESC')
      .limit(Math.min(limit, 1000))
      .offset(Math.max(0, page) * Math.min(limit, 1000));

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      if (!year || !mon) throw new BadRequestException('Parametro month invalido');
      const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
      qb.andWhere('a.appointment_at BETWEEN :start AND :end', { start, end });
    }

    const rows = await qb.getRawMany();
    return rows.map((row) => ({
      ...row,
      servicePrice: Number(row.servicePrice),
      appointmentAt: new Date(row.appointmentAt).toISOString(),
    }));
  }

  async listStalePending(olderThanMinutes = 120) {
    const threshold = new Date(Date.now() - olderThanMinutes * 60_000);
    const rows = await this.appointmentsRepo
      .createQueryBuilder('a')
      .innerJoin(ClientEntity, 'c', 'c.id = a.client_id')
      .innerJoin(ServiceEntity, 's', 's.id = a.service_id')
      .select([
        'a.id AS id',
        'c.name AS "clientName"',
        'c.phone AS "clientPhone"',
        's.name AS "serviceName"',
        'a.appointment_at AS "appointmentAt"',
        'a.created_at AS "createdAt"',
      ])
      .where('a.status = :status', { status: 'PENDING' })
      .andWhere('a.created_at < :threshold', { threshold })
      .orderBy('a.created_at', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      ...row,
      appointmentAt: new Date(row.appointmentAt).toISOString(),
      createdAt: new Date(row.createdAt).toISOString(),
      minutesPending: Math.max(1, Math.floor((Date.now() - new Date(row.createdAt).getTime()) / 60_000)),
    }));
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.appointmentsRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Turno no encontrado');
    appointment.status = status;
    const saved = await this.appointmentsRepo.save(appointment);
    return this.mapAppointment(saved);
  }

  async deleteAppointment(id: string) {
    await this.appointmentsRepo.delete({ id });
  }

  async listClients(limit = 500, page = 0) {
    const clients = await this.clientsRepo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 1000),
      skip: Math.max(page, 0) * Math.min(limit, 1000),
    });

    const byClient = new Map<string, { totalCompleted: number; lastVisit: string | null }>();
    if (clients.length > 0) {
      const ids = clients.map((c) => c.id);
      const stats = await this.appointmentsRepo
        .createQueryBuilder('a')
        .select('a.client_id', 'clientId')
        .addSelect(`COUNT(*) FILTER (WHERE a.status = 'COMPLETED')`, 'totalCompleted')
        .addSelect('MAX(a.appointment_at)', 'lastVisit')
        .where('a.client_id IN (:...ids)', { ids })
        .groupBy('a.client_id')
        .getRawMany();

      for (const row of stats) {
        byClient.set(row.clientId, {
          totalCompleted: Number(row.totalCompleted || 0),
          lastVisit: row.lastVisit ? new Date(row.lastVisit).toISOString() : null,
        });
      }
    }

    return clients.map((c) => {
      const stats = byClient.get(c.id);
      return {
        id: c.id,
        clientName: c.name,
        clientPhone: c.phone,
        totalAppointments: stats?.totalCompleted ?? 0,
        lastVisit: stats?.lastVisit,
      };
    });
  }

  async updateClient(id: string, dto: AdminClientUpsertDto) {
    const client = await this.clientsRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    const normalizedPhone = this.phoneService.normalize(dto.phone);
    if (!normalizedPhone) throw new BadRequestException('Telefono invalido');

    client.name = dto.name;
    client.phone = dto.phone;
    client.phoneNormalized = normalizedPhone;

    await this.clientsRepo.save(client);
    return {
      id: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      totalAppointments: 0,
      lastVisit: null,
    };
  }

  async mergeClients(sourceClientId: string, targetClientId: string) {
    if (sourceClientId === targetClientId) throw new BadRequestException('Origen y destino no pueden coincidir');

    const source = await this.clientsRepo.findOne({ where: { id: sourceClientId } });
    const target = await this.clientsRepo.findOne({ where: { id: targetClientId } });
    if (!source || !target) throw new NotFoundException('Cliente no encontrado');

    await this.appointmentsRepo.update({ clientId: source.id }, { clientId: target.id });
    await this.clientsRepo.delete({ id: source.id });

    return {
      id: target.id,
      clientName: target.name,
      clientPhone: target.phone,
      totalAppointments: 0,
      lastVisit: null,
    };
  }

  async deleteClient(id: string) {
    const client = await this.clientsRepo.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const appointmentsCount = await this.appointmentsRepo.count({ where: { clientId: id } });
    if (appointmentsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el cliente porque tiene turnos asociados. Fusiona el cliente o elimina sus turnos primero.',
      );
    }

    await this.clientsRepo.delete({ id });
  }

  async getOverviewMetrics() {
    const totals = await this.appointmentsRepo
      .createQueryBuilder('a')
      .select('COUNT(*)', 'totalAppointments')
      .addSelect(`COUNT(*) FILTER (WHERE a.status = 'PENDING')`, 'pendingAppointments')
      .addSelect(`COUNT(*) FILTER (WHERE a.status = 'COMPLETED')`, 'completedAppointments')
      .getRawOne();

    const uniqueClients = await this.clientsRepo.count();

    const popular = await this.appointmentsRepo
      .createQueryBuilder('a')
      .innerJoin(ServiceEntity, 's', 's.id = a.service_id')
      .select('s.name', 'serviceName')
      .addSelect('COUNT(*)', 'total')
      .where('a.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED', 'COMPLETED'] })
      .groupBy('s.name')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      totalAppointments: Number(totals?.totalAppointments ?? 0),
      pendingAppointments: Number(totals?.pendingAppointments ?? 0),
      completedAppointments: Number(totals?.completedAppointments ?? 0),
      uniqueClients,
      popularService: popular?.serviceName ?? '-',
    };
  }

  async getIncomeMetrics(month?: string) {
    const range = this.resolveMonthRange(month);

    const completedRows = await this.appointmentsRepo
      .createQueryBuilder('a')
      .innerJoin(ServiceEntity, 's', 's.id = a.service_id')
      .select('s.name', 'serviceName')
      .addSelect('s.price', 'servicePrice')
      .addSelect('COUNT(*)', 'count')
      .where('a.status = :status', { status: 'COMPLETED' })
      .andWhere('a.appointment_at BETWEEN :start AND :end', range)
      .groupBy('s.name')
      .addGroupBy('s.price')
      .orderBy('s.name', 'ASC')
      .getRawMany();

    const breakdown = completedRows.map((row) => ({
      serviceName: row.serviceName,
      count: Number(row.count),
      total: Number(row.count) * Number(row.servicePrice),
    }));

    const registeredIncome = breakdown.reduce((acc, item) => acc + item.total, 0);

    const manualEntries = await this.manualIncomeRepo
      .createQueryBuilder('m')
      .where('m.occurred_on BETWEEN :start::date AND :end::date', {
        start: range.start.toISOString().slice(0, 10),
        end: range.end.toISOString().slice(0, 10),
      })
      .orderBy('m.occurred_on', 'DESC')
      .addOrderBy('m.created_at', 'DESC')
      .getMany();

    const mappedManual = manualEntries.map((entry) => ({
      id: entry.id,
      amount: Number(entry.amount),
      tipAmount: Number(entry.tipAmount),
      total: Number(entry.amount) + Number(entry.tipAmount),
      occurredOn: entry.occurredOn,
      notes: entry.notes,
    }));

    const manualIncome = mappedManual.reduce((acc, item) => acc + item.amount, 0);
    const totalTips = mappedManual.reduce((acc, item) => acc + item.tipAmount, 0);
    const totalIncome = registeredIncome + manualIncome + totalTips;

    return {
      registeredIncome,
      manualIncome,
      totalTips,
      totalIncome,
      monthlyIncome: totalIncome,
      breakdown,
      manualEntries: mappedManual,
    };
  }

  async createManualIncome(dto: CreateManualIncomeDto) {
    const entity = this.manualIncomeRepo.create({
      amount: dto.amount.toString(),
      tipAmount: dto.tipAmount.toString(),
      occurredOn: dto.occurredOn.slice(0, 10),
      notes: dto.notes ?? null,
    });
    const saved = await this.manualIncomeRepo.save(entity);
    return this.mapManual(saved);
  }

  async updateManualIncome(id: string, dto: CreateManualIncomeDto) {
    const entity = await this.manualIncomeRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Ingreso manual no encontrado');
    entity.amount = dto.amount.toString();
    entity.tipAmount = dto.tipAmount.toString();
    entity.occurredOn = dto.occurredOn.slice(0, 10);
    entity.notes = dto.notes ?? null;
    const saved = await this.manualIncomeRepo.save(entity);
    return this.mapManual(saved);
  }

  async deleteManualIncome(id: string) {
    await this.manualIncomeRepo.delete({ id });
  }

  async listServices() {
    const rows = await this.servicesRepo.find({ order: { name: 'ASC' } });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      durationMinutes: row.durationMinutes,
      description: row.description,
      active: row.active,
    }));
  }

  async createService(dto: AdminServiceUpsertDto) {
    const entity = this.servicesRepo.create({
      name: dto.name,
      price: dto.price.toString(),
      durationMinutes: dto.durationMinutes,
      description: dto.description ?? null,
      active: dto.active,
    });
    const saved = await this.servicesRepo.save(entity);
    return this.mapService(saved);
  }

  async updateService(id: string, dto: AdminServiceUpsertDto) {
    const entity = await this.servicesRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Servicio no encontrado');

    entity.name = dto.name;
    entity.price = dto.price.toString();
    entity.durationMinutes = dto.durationMinutes;
    entity.description = dto.description ?? null;
    entity.active = dto.active;

    const saved = await this.servicesRepo.save(entity);
    return this.mapService(saved);
  }

  async deleteService(id: string) {
    const service = await this.servicesRepo.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const appointmentsCount = await this.appointmentsRepo.count({ where: { serviceId: id } });
    if (appointmentsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el servicio porque tiene turnos asociados. Elimina o reasigna esos turnos primero.',
      );
    }

    await this.servicesRepo.delete({ id });
  }

  async listGallery(limit = 500, page = 0) {
    const rows = await this.galleryRepo.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      take: Math.min(limit, 1000),
      skip: Math.max(page, 0) * Math.min(limit, 1000),
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      active: row.active,
    }));
  }

  getGalleryUploadSignature() {
    const { cloudName, apiKey, apiSecret, folder } = this.resolveCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = this.buildCloudinaryPublicId(timestamp);

    const signature = this.signCloudinaryParams(
      {
        folder,
        public_id: publicId,
        timestamp: String(timestamp),
      },
      apiSecret,
    );

    return {
      cloudName,
      apiKey,
      folder,
      timestamp,
      publicId,
      signature,
    };
  }

  async uploadGalleryImage(file?: { buffer: Buffer; mimetype: string; size: number; originalname: string }) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new BadRequestException('La imagen supera el limite de 8MB');
    }

    const { cloudName, apiKey, folder } = this.resolveCloudinaryConfig();
    const { timestamp, publicId, signature } = this.getGalleryUploadSignature();

    const formData = new FormData();
    const bytes = Uint8Array.from(file.buffer);
    formData.append('file', new Blob([bytes], { type: file.mimetype }), file.originalname || 'gallery-image');
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', publicId);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new BadRequestException('No se pudo subir la imagen a Cloudinary');
    }

    const data = (await uploadResponse.json()) as { secure_url?: string };
    if (!data.secure_url) {
      throw new BadRequestException('Cloudinary no devolvio URL de imagen');
    }

    return {
      imageUrl: data.secure_url,
      timestamp,
    };
  }

  async createGalleryImage(dto: AdminGalleryImageUpsertDto) {
    const entity = this.galleryRepo.create({
      title: dto.title,
      category: dto.category ?? null,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
      active: dto.active,
    });
    const saved = await this.galleryRepo.save(entity);
    return this.mapGallery(saved);
  }

  async updateGalleryImage(id: string, dto: AdminGalleryImageUpsertDto) {
    const entity = await this.galleryRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Imagen no encontrada');

    entity.title = dto.title;
    entity.category = dto.category ?? null;
    entity.imageUrl = dto.imageUrl;
    entity.sortOrder = dto.sortOrder;
    entity.active = dto.active;

    const saved = await this.galleryRepo.save(entity);
    return this.mapGallery(saved);
  }

  async deleteGalleryImage(id: string) {
    await this.galleryRepo.delete({ id });
  }

  async listAdminUsers() {
    const admins = await this.adminUsersRepo.find({ order: { createdAt: 'ASC' } });
    return admins.map((admin) => this.mapAdminUser(admin));
  }

  async createAdminUser(dto: AdminUserCreateDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.adminUsersRepo
      .createQueryBuilder('a')
      .where('lower(a.email) = :email', { email })
      .getOne();

    if (existing) {
      throw new BadRequestException('Ya existe un administrador con ese email');
    }

    const passwordToHash = dto.password?.trim() || randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const created = this.adminUsersRepo.create({
      email,
      passwordHash,
      active: dto.active,
      role: 'ADMIN',
      firebaseUid: null,
    });

    const saved = await this.adminUsersRepo.save(created);
    return this.mapAdminUser(saved);
  }

  async updateAdminUser(id: string, dto: AdminUserUpdateDto, currentAdminId: string | null) {
    const admin = await this.adminUsersRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Administrador no encontrado');

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.adminUsersRepo
        .createQueryBuilder('a')
        .where('lower(a.email) = :email', { email })
        .andWhere('a.id <> :id', { id })
        .getOne();

      if (existing) {
        throw new BadRequestException('Ya existe un administrador con ese email');
      }
      admin.email = email;
    }

    if (dto.password) {
      admin.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    if (typeof dto.active === 'boolean') {
      if (!dto.active && currentAdminId && currentAdminId === admin.id) {
        throw new BadRequestException('No puedes desactivar tu propio usuario');
      }
      admin.active = dto.active;
    }

    const saved = await this.adminUsersRepo.save(admin);
    return this.mapAdminUser(saved);
  }

  async deleteAdminUser(id: string, currentAdminId: string | null) {
    const admin = await this.adminUsersRepo.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Administrador no encontrado');

    if (currentAdminId && currentAdminId === admin.id) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }

    await this.adminUsersRepo.delete({ id });
  }

  private mapAppointment(appointment: AppointmentEntity) {
    return {
      id: appointment.id,
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      appointmentAt: appointment.appointmentAt.toISOString(),
      status: appointment.status,
      notes: appointment.notes,
    };
  }

  private mapManual(entry: ManualIncomeEntryEntity) {
    const amount = Number(entry.amount);
    const tipAmount = Number(entry.tipAmount);
    return {
      id: entry.id,
      amount,
      tipAmount,
      total: amount + tipAmount,
      occurredOn: entry.occurredOn,
      notes: entry.notes,
    };
  }

  private mapService(service: ServiceEntity) {
    return {
      id: service.id,
      name: service.name,
      price: Number(service.price),
      durationMinutes: service.durationMinutes,
      description: service.description,
      active: service.active,
    };
  }

  private mapGallery(image: GalleryImageEntity) {
    return {
      id: image.id,
      title: image.title,
      category: image.category,
      imageUrl: image.imageUrl,
      sortOrder: image.sortOrder,
      active: image.active,
    };
  }

  private resolveMonthRange(month?: string) {
    const now = new Date();
    const resolved = month && /^\d{4}-\d{2}$/.test(month)
      ? month
      : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const [year, mon] = resolved.split('-').map(Number);
    const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
    return { start, end };
  }

  private mapAdminUser(admin: AdminUserEntity) {
    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      active: admin.active,
      firebaseLinked: Boolean(admin.firebaseUid),
      createdAt: admin.createdAt.toISOString(),
    };
  }

  private signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
    const base = Object.entries(params)
      .filter(([, value]) => value.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return createHash('sha1').update(base + apiSecret).digest('hex');
  }

  private resolveCloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
    const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'stylebook/gallery';

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException('Cloudinary no configurado');
    }

    return { cloudName, apiKey, apiSecret, folder };
  }

  private buildCloudinaryPublicId(timestamp: number): string {
    return `gallery_${timestamp}_${Math.floor(Math.random() * 1_000_000)}`;
  }
}





