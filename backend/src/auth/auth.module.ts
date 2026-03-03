import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AuthService } from './auth.service';
import { BootstrapAdminService } from './bootstrap-admin.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FirebaseTokenVerifierService } from './firebase-token-verifier.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, BootstrapAdminService, FirebaseTokenVerifierService],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}


