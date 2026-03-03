import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { ServiceEntity } from '../entities/service.entity';
import { GalleryImageEntity } from '../entities/gallery-image.entity';
import { ClientEntity } from '../entities/client.entity';
import { AppointmentEntity } from '../entities/appointment.entity';
import { BarberEntity } from '../entities/barber.entity';
import { PhoneService } from '../common/phone.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity, GalleryImageEntity, ClientEntity, AppointmentEntity, BarberEntity])],
  controllers: [PublicController],
  providers: [PublicService, PhoneService],
})
export class PublicModule {}

