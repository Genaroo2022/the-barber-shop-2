import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { FirebaseTokenVerifierService } from './firebase-token-verifier.service';
import { getRequiredJwtSecret } from './auth-config.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    private readonly jwtService: JwtService,
    private readonly firebaseTokenVerifier: FirebaseTokenVerifierService,
  ) {}

  async loginWithFirebaseIdToken(idToken: string) {
    const verified = await this.firebaseTokenVerifier.verifyIdToken(idToken);
    if (!verified.email || !verified.emailVerified) {
      throw new UnauthorizedException('Debes usar una cuenta Google con email verificado');
    }

    let admin = await this.adminRepo.findOne({ where: { firebaseUid: verified.uid, active: true } });

    // Strict allowlist via admin_users: only active admins are allowed to auto-link once by email.
    if (!admin) {
      admin = await this.adminRepo
        .createQueryBuilder('a')
        .where('lower(a.email) = lower(:email)', { email: verified.email })
        .andWhere('a.active = true')
        .getOne();

      if (admin && !admin.firebaseUid) {
        admin.firebaseUid = verified.uid;
        admin = await this.adminRepo.save(admin);
      }
    }

    if (!admin) {
      throw new UnauthorizedException('Usuario admin no autorizado para login con Firebase');
    }

    return this.issueToken(admin.id);
  }

  private issueToken(userId: string) {
    const expiresInSeconds = Number(process.env.JWT_EXPIRATION_SECONDS ?? 28_800);
    const jwtSecret = getRequiredJwtSecret();
    const accessToken = this.jwtService.sign(
      { sub: userId, role: 'ADMIN' },
      {
        secret: jwtSecret,
        expiresIn: `${expiresInSeconds}s`,
      },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds,
    };
  }
}
