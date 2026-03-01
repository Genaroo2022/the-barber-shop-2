import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ClientEntity } from '../entities/client.entity';
import { PhoneService } from '../common/phone.service';

@Injectable()
export class WebhooksService {
  private readonly cooldown = new Map<string, number>();

  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentsRepo: Repository<AppointmentEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientsRepo: Repository<ClientEntity>,
    private readonly phoneService: PhoneService,
  ) {}

  verify(mode?: string, token?: string, challenge?: string) {
    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '';
    if (mode === 'subscribe' && token && expected && token === expected && challenge) {
      return challenge;
    }
    return null;
  }

  async handleWebhook(payload: unknown) {
    const enabled = String(process.env.WHATSAPP_AUTOREPLY_ENABLED ?? 'false').toLowerCase() === 'true';
    if (!enabled) {
      return { received: true, autoReply: false };
    }

    const phone = this.extractPhone(payload);
    if (!phone) {
      return { received: true, autoReply: false };
    }

    const normalized = this.phoneService.normalize(phone);
    const now = Date.now();
    const cooldownMinutes = Number(process.env.WHATSAPP_AUTOREPLY_COOLDOWN_MINUTES ?? 60);
    const lookbackMinutes = Number(process.env.WHATSAPP_AUTOREPLY_LOOKBACK_MINUTES ?? 720);

    const until = this.cooldown.get(normalized);
    if (until && until > now) {
      return { received: true, autoReply: false, reason: 'cooldown' };
    }

    const client = await this.clientsRepo.findOne({ where: { phoneNormalized: normalized } });
    if (!client) {
      return { received: true, autoReply: false, reason: 'no-client' };
    }

    const lookbackStart = new Date(now - lookbackMinutes * 60_000);
    const appointment = await this.appointmentsRepo
      .createQueryBuilder('a')
      .where('a.client_id = :clientId', { clientId: client.id })
      .andWhere('a.status IN (:...statuses)', { statuses: ['PENDING', 'CONFIRMED'] })
      .andWhere('a.created_at >= :lookbackStart', { lookbackStart })
      .orderBy('a.created_at', 'DESC')
      .getOne();

    if (!appointment) {
      return { received: true, autoReply: false, reason: 'no-recent-appointment' };
    }

    this.cooldown.set(normalized, now + cooldownMinutes * 60_000);
    return { received: true, autoReply: true };
  }

  private extractPhone(payload: unknown): string | null {
    const obj = payload as any;
    const value = obj?.entry?.[0]?.changes?.[0]?.value;
    const messagePhone = value?.messages?.[0]?.from;
    return typeof messagePhone === 'string' ? messagePhone : null;
  }
}

