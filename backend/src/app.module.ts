import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MigrationService } from './database/migration.service';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ClientEntity } from './entities/client.entity';
import { ServiceEntity } from './entities/service.entity';
import { AppointmentEntity } from './entities/appointment.entity';
import { AdminUserEntity } from './entities/admin-user.entity';
import { ManualIncomeEntryEntity } from './entities/manual-income-entry.entity';
import { GalleryImageEntity } from './entities/gallery-image.entity';
import { PhoneService } from './common/phone.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60_000,
          limit: config.get<number>('RATE_LIMIT_PER_MINUTE', 80),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'style_book'),
        entities: [ClientEntity, ServiceEntity, AppointmentEntity, AdminUserEntity, ManualIncomeEntryEntity, GalleryImageEntity],
        synchronize: false,
        logging: false,
      }),
    }),
    AuthModule,
    PublicModule,
    AdminModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService, MigrationService, PhoneService],
  exports: [PhoneService],
})
export class AppModule {}

