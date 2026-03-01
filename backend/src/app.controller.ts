import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get(['/api/health', '/api/health/'])
  health() {
    return { status: 'ok' };
  }
}

