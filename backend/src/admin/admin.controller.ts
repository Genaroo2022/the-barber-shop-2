import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AdminBarberUpsertDto,
  AdminUserCreateDto,
  AdminUserUpdateDto,
  AdminClientUpsertDto,
  AdminGalleryImageUpsertDto,
  AdminServiceUpsertDto,
  CreateManualIncomeDto,
  MergeClientsDto,
  UpdateAppointmentBarberDto,
  UpdateAppointmentStatusDto,
} from './admin.dto';
import { AdminService } from './admin.service';
import { resolveAdminBarbershopId } from '../common/barbershop-context';

type AdminRequest = Request & {
  user?: {
    sub?: string;
    barbershopId?: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('/api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/appointments')
  listAppointments(
    @Req() req: AdminRequest,
    @Query('month') month?: string,
    @Query('barberId') barberId?: string,
    @Query('limit') limit = 500,
    @Query('page') page = 0,
  ) {
    return this.adminService.listAppointments(month, barberId, Number(limit), Number(page), this.getBarbershopId(req));
  }

  @Get('/appointments/stale-pending')
  listStalePending(
    @Req() req: AdminRequest,
    @Query('olderThanMinutes') olderThanMinutes = 120,
    @Query('barberId') barberId?: string,
  ) {
    return this.adminService.listStalePending(Number(olderThanMinutes), barberId, this.getBarbershopId(req));
  }

  @Patch('/appointments/:id/status')
  updateStatus(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.adminService.updateAppointmentStatus(id, dto.status, this.getBarbershopId(req));
  }

  @Patch('/appointments/:id/barber')
  updateAppointmentBarber(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: UpdateAppointmentBarberDto) {
    return this.adminService.updateAppointmentBarber(id, dto.barberId, this.getBarbershopId(req));
  }

  @Delete('/appointments/:id')
  deleteAppointment(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteAppointment(id, this.getBarbershopId(req));
  }

  @Get('/clients')
  listClients(@Req() req: AdminRequest, @Query('limit') limit = 500, @Query('page') page = 0) {
    return this.adminService.listClients(Number(limit), Number(page), this.getBarbershopId(req));
  }

  @Put('/clients/:id')
  updateClient(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: AdminClientUpsertDto) {
    return this.adminService.updateClient(id, dto, this.getBarbershopId(req));
  }

  @Post('/clients/merge')
  mergeClients(@Req() req: AdminRequest, @Body() dto: MergeClientsDto) {
    return this.adminService.mergeClients(dto.sourceClientId, dto.targetClientId, this.getBarbershopId(req));
  }

  @Delete('/clients/:id')
  deleteClient(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteClient(id, this.getBarbershopId(req));
  }

  @Get('/metrics/overview')
  getOverview(@Req() req: AdminRequest) {
    return this.adminService.getOverviewMetrics(this.getBarbershopId(req));
  }

  @Get('/metrics/income')
  getIncome(@Req() req: AdminRequest, @Query('month') month?: string) {
    return this.adminService.getIncomeMetrics(month, this.getBarbershopId(req));
  }

  @Post('/metrics/income/manual')
  createManualIncome(@Req() req: AdminRequest, @Body() dto: CreateManualIncomeDto) {
    return this.adminService.createManualIncome(dto, this.getBarbershopId(req));
  }

  @Put('/metrics/income/manual/:id')
  updateManualIncome(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: CreateManualIncomeDto) {
    return this.adminService.updateManualIncome(id, dto, this.getBarbershopId(req));
  }

  @Delete('/metrics/income/manual/:id')
  deleteManualIncome(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteManualIncome(id, this.getBarbershopId(req));
  }

  @Get('/services')
  listServices(@Req() req: AdminRequest) {
    return this.adminService.listServices(this.getBarbershopId(req));
  }

  @Post('/services')
  createService(
    @Req() req: AdminRequest,
    @Body() dto: AdminServiceUpsertDto,
  ) {
    return this.adminService.createService(dto, this.getBarbershopId(req));
  }

  @Put('/services/:id')
  updateService(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: AdminServiceUpsertDto,
  ) {
    return this.adminService.updateService(id, dto, this.getBarbershopId(req));
  }

  @Delete('/services/:id')
  deleteService(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteService(id, this.getBarbershopId(req));
  }

  @Get('/barbers')
  listBarbers(@Req() req: AdminRequest) {
    return this.adminService.listBarbers(this.getBarbershopId(req));
  }

  @Post('/barbers')
  createBarber(
    @Req() req: AdminRequest,
    @Body() dto: AdminBarberUpsertDto,
  ) {
    return this.adminService.createBarber(dto, this.getBarbershopId(req));
  }

  @Put('/barbers/:id')
  updateBarber(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: AdminBarberUpsertDto,
  ) {
    return this.adminService.updateBarber(id, dto, this.getBarbershopId(req));
  }

  @Delete('/barbers/:id')
  deleteBarber(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteBarber(id, this.getBarbershopId(req));
  }

  @Get('/gallery')
  listGallery(@Req() req: AdminRequest, @Query('limit') limit = 500, @Query('page') page = 0) {
    return this.adminService.listGallery(Number(limit), Number(page), this.getBarbershopId(req));
  }

  @Get('/gallery/upload-signature')
  getGalleryUploadSignature(@Req() req: AdminRequest) {
    return this.adminService.getGalleryUploadSignature(this.getBarbershopId(req));
  }

  @Post('/gallery/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadGallery(
    @Req() req: AdminRequest,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number; originalname: string },
  ) {
    return this.adminService.uploadGalleryImage(file, this.getBarbershopId(req));
  }

  @Post('/gallery')
  createGallery(@Req() req: AdminRequest, @Body() dto: AdminGalleryImageUpsertDto) {
    return this.adminService.createGalleryImage(dto, this.getBarbershopId(req));
  }

  @Put('/gallery/:id')
  updateGallery(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: AdminGalleryImageUpsertDto) {
    return this.adminService.updateGalleryImage(id, dto, this.getBarbershopId(req));
  }

  @Delete('/gallery/:id')
  deleteGallery(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteGalleryImage(id, this.getBarbershopId(req));
  }

  @Get('/admin-users')
  listAdminUsers(@Req() req: AdminRequest) {
    return this.adminService.listAdminUsers(this.getBarbershopId(req));
  }

  @Post('/admin-users')
  createAdminUser(@Req() req: AdminRequest, @Body() dto: AdminUserCreateDto) {
    return this.adminService.createAdminUser(dto, this.getBarbershopId(req));
  }

  @Patch('/admin-users/:id')
  updateAdminUser(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() dto: AdminUserUpdateDto,
  ) {
    return this.adminService.updateAdminUser(id, dto, req.user?.sub ?? null, this.getBarbershopId(req));
  }

  @Delete('/admin-users/:id')
  deleteAdminUser(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteAdminUser(id, req.user?.sub ?? null, this.getBarbershopId(req));
  }

  private getBarbershopId(req: AdminRequest): string {
    return resolveAdminBarbershopId(req.headers['x-barbershop-id'], req.user?.barbershopId);
  }
}
