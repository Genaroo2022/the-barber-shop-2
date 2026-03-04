import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { CreatePublicAppointmentDto } from './create-public-appointment.dto';
import { resolveBarbershopId } from '../common/barbershop-context';

@Controller('/api/public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('/services')
  listServices(@Req() req: Request) {
    const barbershopId = resolveBarbershopId(req.headers['x-barbershop-id']);
    return this.publicService.listServices(barbershopId);
  }

  @Get('/gallery')
  listGallery(@Req() req: Request) {
    const barbershopId = resolveBarbershopId(req.headers['x-barbershop-id']);
    return this.publicService.listGallery(barbershopId);
  }

  @Get('/barbers')
  listBarbers(@Req() req: Request) {
    const barbershopId = resolveBarbershopId(req.headers['x-barbershop-id']);
    return this.publicService.listBarbers(barbershopId);
  }

  @Get('/appointments/occupied')
  listOccupied(
    @Req() req: Request,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('barberId') barberId: string,
  ) {
    const barbershopId = resolveBarbershopId(req.headers['x-barbershop-id']);
    return this.publicService.listOccupied(serviceId, date, barberId, barbershopId);
  }

  @Post('/appointments')
  createAppointment(@Req() req: Request, @Body() dto: CreatePublicAppointmentDto) {
    const barbershopId = resolveBarbershopId(req.headers['x-barbershop-id']);
    return this.publicService.createAppointment(dto, barbershopId);
  }
}
