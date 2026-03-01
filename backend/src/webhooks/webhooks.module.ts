import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ClientEntity } from '../entities/client.entity';
import { PhoneService } from '../common/phone.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentEntity, ClientEntity])],
  controllers: [WebhooksController],
  providers: [WebhooksService, PhoneService],
})
export class WebhooksModule {}

