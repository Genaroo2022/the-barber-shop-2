import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.adminRepo
      .createQueryBuilder('a')
      .where('lower(a.email) = lower(:email)', { email })
      .andWhere('a.active = true')
      .getOne();

    if (!admin) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return this.issueToken(admin.id);
  }

  async loginWithFirebaseIdToken(idToken: string) {
    const uid = this.extractUid(idToken);
    if (!uid) {
      throw new UnauthorizedException('Token de Firebase invalido');
    }

    const admin = await this.adminRepo.findOne({ where: { firebaseUid: uid, active: true } });
    if (!admin) {
      throw new UnauthorizedException(`Usuario no encontrado. UID: ${uid}`);
    }

    return this.issueToken(admin.id);
  }

  private issueToken(userId: string) {
    const expiresInSeconds = Number(process.env.JWT_EXPIRATION_SECONDS ?? 28_800);
    const accessToken = this.jwtService.sign(
      { sub: userId, role: 'ADMIN' },
      {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
        expiresIn: `${expiresInSeconds}s`,
      },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds,
    };
  }

  private extractUid(idToken: string): string | null {
    const chunks = idToken.split('.');
    if (chunks.length < 2) return null;
    try {
      const payloadJson = Buffer.from(chunks[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as { user_id?: string; sub?: string };
      return payload.user_id ?? payload.sub ?? null;
    } catch {
      return null;
    }
  }
}

