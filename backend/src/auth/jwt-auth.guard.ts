import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { getRequiredJwtSecret } from './auth-config.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('No autenticado');
    }

    const token = auth.slice(7);
    try {
      const jwtSecret = getRequiredJwtSecret();
      const payload = this.jwtService.verify<{ sub?: string }>(token, {
        secret: jwtSecret,
      });
      const adminId = payload?.sub;
      if (!adminId) {
        throw new UnauthorizedException('Token invalido');
      }

      const admin = await this.adminRepo.findOne({
        where: { id: adminId, active: true },
        select: { id: true },
      });
      if (!admin) {
        throw new UnauthorizedException('Sesion expirada o usuario inactivo');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token invalido');
    }
  }
}
