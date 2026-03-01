import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization as string | undefined;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('No autenticado');
    }

    const token = auth.slice(7);
    try {
      request.user = this.jwtService.verify(token, { secret: process.env.JWT_SECRET ?? 'dev-secret-change-me' });
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }
}

