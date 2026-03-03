import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AppointmentEntity } from '../entities/appointment.entity';
import { BarberEntity } from '../entities/barber.entity';
import { ClientEntity } from '../entities/client.entity';
import { GalleryImageEntity } from '../entities/gallery-image.entity';
import { ServiceEntity } from '../entities/service.entity';
import { PhoneService } from '../common/phone.service';
import { CreatePublicAppointmentDto } from './create-public-appointment.dto';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepo: Repository<ServiceEntity>,
    @InjectRepository(GalleryImageEntity)
    private readonly galleryRepo: Repository<GalleryImageEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientsRepo: Repository<ClientEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepo: Repository<AppointmentEntity>,
    @InjectRepository(BarberEntity)
    private readonly barbersRepo: Repository<BarberEntity>,
    private readonly phoneService: PhoneService,
  ) {}

  async listServices(barbershopId: string) {
    const rows = await this.servicesRepo.find({ where: { active: true, barbershopId }, order: { name: 'ASC' } });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      durationMinutes: row.durationMinutes,
      description: row.description,
      active: row.active,
    }));
  }

  async listGallery() {
    const rows = await this.galleryRepo.find({ where: { active: true }, order: { sortOrder: 'ASC', createdAt: 'DESC' } });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      active: row.active,
    }));
  }

  async listBarbers(barbershopId: string) {
    const rows = await this.barbersRepo.find({
      where: { barbershopId, active: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      active: row.active,
      sortOrder: row.sortOrder,
    }));
  }

  async listOccupied(serviceId: string, date: string, barberId: string, barbershopId: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fecha invalida');
    }

    const service = await this.servicesRepo.findOne({ where: { id: serviceId, active: true, barbershopId } });
    if (!service) {
      throw new BadRequestException('Servicio no disponible');
    }
    const barber = await this.barbersRepo.findOne({ where: { id: barberId, barbershopId, active: true } });
    if (!barber) {
      throw new BadRequestException('Barbero no disponible');
    }

    const rows = await this.appointmentsRepo
      .createQueryBuilder('a')
      .where('a.barbershop_id = :barbershopId', { barbershopId })
      .andWhere('a.barber_id = :barberId', { barberId })
      .andWhere('a.appointment_at BETWEEN :start AND :end', { start, end })
      .andWhere('a.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED', 'COMPLETED'] })
      .orderBy('a.appointment_at', 'ASC')
      .getMany();

    return rows.map((row) => ({ appointmentAt: row.appointmentAt.toISOString() }));
  }

  async createAppointment(dto: CreatePublicAppointmentDto, barbershopId: string) {
    const service = await this.servicesRepo.findOne({ where: { id: dto.serviceId, active: true, barbershopId } });
    if (!service) {
      throw new BadRequestException('Servicio no disponible');
    }
    const barber = await this.barbersRepo.findOne({ where: { id: dto.barberId, barbershopId, active: true } });
    if (!barber) {
      throw new BadRequestException('Barbero no disponible');
    }

    const appointmentAt = new Date(dto.appointmentAt);
    if (Number.isNaN(appointmentAt.getTime())) {
      throw new BadRequestException('Fecha de turno invalida');
    }
    if (appointmentAt.getTime() <= Date.now()) {
      throw new BadRequestException('No se puede reservar un turno en una fecha u horario pasado');
    }

    const normalizedPhone = this.phoneService.normalize(dto.clientPhone);
    if (!normalizedPhone) {
      throw new BadRequestException('Telefono invalido');
    }

    let client = await this.clientsRepo.findOne({ where: { barbershopId, phoneNormalized: normalizedPhone } });
    if (!client) {
      client = this.clientsRepo.create({
        barbershopId,
        name: dto.clientName.trim(),
        phone: dto.clientPhone.trim(),
        phoneNormalized: normalizedPhone,
      });
      client = await this.clientsRepo.save(client);
    }

    const appointment = this.appointmentsRepo.create({
      barbershopId,
      barberId: dto.barberId,
      clientId: client.id,
      serviceId: service.id,
      appointmentAt,
      status: 'PENDING',
      notes: dto.notes?.trim() || null,
    });

    try {
      const saved = await this.appointmentsRepo.save(appointment);

      return {
        id: saved.id,
        serviceId: service.id,
        serviceName: service.name,
        appointmentAt: saved.appointmentAt.toISOString(),
        status: saved.status,
      };
    } catch (error) {
      const pgCode = (error as { driverError?: { code?: string } })?.driverError?.code;
      if (error instanceof QueryFailedError && pgCode === '23505') {
        throw new ConflictException('Horario no disponible para este barbero. Elige otro horario.');
      }
      throw error;
    }
  }
}
