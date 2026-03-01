import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { FirebaseLoginDto } from './firebase-login.dto';
import { SimpleRateLimitService } from '../rate-limit/simple-rate-limit.service';

@Controller('/api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimit: SimpleRateLimitService,
  ) {}

  @Post('/login')
  async login(@Req() req: Request & { ip?: string }, @Body() dto: LoginDto) {
    this.rateLimit.consume(`login:${req.ip ?? 'unknown'}:${dto.email.toLowerCase()}`, 12, 60_000);
    return this.authService.login(dto.email, dto.password);
  }

  @Post('/login/firebase')
  async loginWithFirebase(@Req() req: Request & { ip?: string }, @Body() dto: FirebaseLoginDto) {
    this.rateLimit.consume(`login_fb:${req.ip ?? 'unknown'}`, 20, 60_000);
    return this.authService.loginWithFirebaseIdToken(dto.idToken);
  }
}

