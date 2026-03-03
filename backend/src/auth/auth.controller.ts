import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './firebase-login.dto';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login/firebase')
  async loginWithFirebase(@Body() dto: FirebaseLoginDto) {
    return this.authService.loginWithFirebaseIdToken(dto.idToken);
  }
}
