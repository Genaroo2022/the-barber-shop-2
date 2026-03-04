import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './firebase-login.dto';
import { resolveBarbershopId } from '../common/barbershop-context';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login/firebase')
  async loginWithFirebase(@Req() req: Request, @Body() dto: FirebaseLoginDto) {
    const barbershopId = resolveBarbershopId(req.headers['x-barbershop-id']);
    return this.authService.loginWithFirebaseIdToken(dto.idToken, barbershopId);
  }
}
