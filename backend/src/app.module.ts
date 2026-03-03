import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
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
import { BarberEntity } from './entities/barber.entity';
import { PhoneService } from './common/phone.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60_000,
          limit: Number(config.get<string>('RATE_LIMIT_PER_MINUTE', '30')),
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
        entities: [
          ClientEntity,
          ServiceEntity,
          AppointmentEntity,
          AdminUserEntity,
          ManualIncomeEntryEntity,
          GalleryImageEntity,
          BarberEntity,
        ],
        synchronize: false,
        logging: false,
        extra: {
          max: Number(config.get<string>('DB_POOL_MAX', '15')),
          idleTimeoutMillis: Number(config.get<string>('DB_POOL_IDLE_MS', '30000')),
        },
      }),
    }),
    AuthModule,
    PublicModule,
    AdminModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [
    MigrationService,
    PhoneService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [PhoneService],
})
export class AppModule {}
