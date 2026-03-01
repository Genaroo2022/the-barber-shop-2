import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AuthService } from './auth.service';
import { BootstrapAdminService } from './bootstrap-admin.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SimpleRateLimitService } from '../rate-limit/simple-rate-limit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, SimpleRateLimitService, BootstrapAdminService],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}


