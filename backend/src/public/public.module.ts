import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { ServiceEntity } from '../entities/service.entity';
import { GalleryImageEntity } from '../entities/gallery-image.entity';
import { ClientEntity } from '../entities/client.entity';
import { AppointmentEntity } from '../entities/appointment.entity';
import { PhoneService } from '../common/phone.service';
import { SimpleRateLimitService } from '../rate-limit/simple-rate-limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity, GalleryImageEntity, ClientEntity, AppointmentEntity])],
  controllers: [PublicController],
  providers: [PublicService, PhoneService, SimpleRateLimitService],
})
export class PublicModule {}

