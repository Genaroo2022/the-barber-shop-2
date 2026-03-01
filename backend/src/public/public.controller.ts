import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { CreatePublicAppointmentDto } from './create-public-appointment.dto';
import { SimpleRateLimitService } from '../rate-limit/simple-rate-limit.service';

@Controller('/api/public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly rateLimit: SimpleRateLimitService,
  ) {}

  @Get('/services')
  listServices() {
    return this.publicService.listServices();
  }

  @Get('/gallery')
  listGallery() {
    return this.publicService.listGallery();
  }

  @Get('/appointments/occupied')
  listOccupied(@Query('serviceId') serviceId: string, @Query('date') date: string) {
    return this.publicService.listOccupied(serviceId, date);
  }

  @Post('/appointments')
  createAppointment(@Req() req: Request & { ip?: string }, @Body() dto: CreatePublicAppointmentDto) {
    this.rateLimit.consume(`booking:${req.ip ?? 'unknown'}`, 20, 60_000);
    this.rateLimit.consume(`booking_hour:${req.ip ?? 'unknown'}`, 120, 3_600_000);
    return this.publicService.createAppointment(dto);
  }
}

