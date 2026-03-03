import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ClientEntity } from '../entities/client.entity';
import { ServiceEntity } from '../entities/service.entity';
import { BarberEntity } from '../entities/barber.entity';
import { ManualIncomeEntryEntity } from '../entities/manual-income-entry.entity';
import { GalleryImageEntity } from '../entities/gallery-image.entity';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AuthModule } from '../auth/auth.module';
import { PhoneService } from '../common/phone.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      AppointmentEntity,
      ClientEntity,
      ServiceEntity,
      BarberEntity,
      ManualIncomeEntryEntity,
      GalleryImageEntity,
      AdminUserEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, PhoneService],
})
export class AdminModule {}

