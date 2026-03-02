import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AdminUserCreateDto,
  AdminUserUpdateDto,
  AdminAppointmentUpsertDto,
  AdminClientUpsertDto,
  AdminGalleryImageUpsertDto,
  AdminServiceUpsertDto,
  CreateManualIncomeDto,
  MergeClientsDto,
  UpdateAppointmentStatusDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard)
@Controller('/api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/appointments')
  listAppointments(
    @Query('month') month?: string,
    @Query('limit') limit = 500,
    @Query('page') page = 0,
  ) {
    return this.adminService.listAppointments(month, Number(limit), Number(page));
  }

  @Get('/appointments/stale-pending')
  listStalePending(@Query('olderThanMinutes') olderThanMinutes = 120) {
    return this.adminService.listStalePending(Number(olderThanMinutes));
  }

  @Patch('/appointments/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.adminService.updateAppointmentStatus(id, dto.status);
  }

  @Put('/appointments/:id')
  updateAppointment(@Param('id') id: string, @Body() dto: AdminAppointmentUpsertDto) {
    return this.adminService.updateAppointment(id, dto);
  }

  @Delete('/appointments/:id')
  deleteAppointment(@Param('id') id: string) {
    return this.adminService.deleteAppointment(id);
  }

  @Get('/clients')
  listClients(@Query('limit') limit = 500, @Query('page') page = 0) {
    return this.adminService.listClients(Number(limit), Number(page));
  }

  @Put('/clients/:id')
  updateClient(@Param('id') id: string, @Body() dto: AdminClientUpsertDto) {
    return this.adminService.updateClient(id, dto);
  }

  @Post('/clients/merge')
  mergeClients(@Body() dto: MergeClientsDto) {
    return this.adminService.mergeClients(dto.sourceClientId, dto.targetClientId);
  }

  @Delete('/clients/:id')
  deleteClient(@Param('id') id: string) {
    return this.adminService.deleteClient(id);
  }

  @Get('/metrics/overview')
  getOverview() {
    return this.adminService.getOverviewMetrics();
  }

  @Get('/metrics/income')
  getIncome(@Query('month') month?: string) {
    return this.adminService.getIncomeMetrics(month);
  }

  @Post('/metrics/income/manual')
  createManualIncome(@Body() dto: CreateManualIncomeDto) {
    return this.adminService.createManualIncome(dto);
  }

  @Put('/metrics/income/manual/:id')
  updateManualIncome(@Param('id') id: string, @Body() dto: CreateManualIncomeDto) {
    return this.adminService.updateManualIncome(id, dto);
  }

  @Delete('/metrics/income/manual/:id')
  deleteManualIncome(@Param('id') id: string) {
    return this.adminService.deleteManualIncome(id);
  }

  @Get('/metrics/clients')
  getClientsCompat(@Query('limit') limit = 500, @Query('page') page = 0) {
    return this.adminService.listClients(Number(limit), Number(page));
  }

  @Get('/services')
  listServices() {
    return this.adminService.listServices();
  }

  @Post('/services')
  createService(@Body() dto: AdminServiceUpsertDto) {
    return this.adminService.createService(dto);
  }

  @Put('/services/:id')
  updateService(@Param('id') id: string, @Body() dto: AdminServiceUpsertDto) {
    return this.adminService.updateService(id, dto);
  }

  @Delete('/services/:id')
  deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(id);
  }

  @Get('/gallery')
  listGallery(@Query('limit') limit = 500, @Query('page') page = 0) {
    return this.adminService.listGallery(Number(limit), Number(page));
  }

  @Get('/gallery/upload-signature')
  getGalleryUploadSignature() {
    return this.adminService.getGalleryUploadSignature();
  }

  @Post('/gallery/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadGallery(@UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number; originalname: string }) {
    return this.adminService.uploadGalleryImage(file);
  }

  @Post('/gallery')
  createGallery(@Body() dto: AdminGalleryImageUpsertDto) {
    return this.adminService.createGalleryImage(dto);
  }

  @Put('/gallery/:id')
  updateGallery(@Param('id') id: string, @Body() dto: AdminGalleryImageUpsertDto) {
    return this.adminService.updateGalleryImage(id, dto);
  }

  @Delete('/gallery/:id')
  deleteGallery(@Param('id') id: string) {
    return this.adminService.deleteGalleryImage(id);
  }

  @Get('/admin-users')
  listAdminUsers() {
    return this.adminService.listAdminUsers();
  }

  @Post('/admin-users')
  createAdminUser(@Body() dto: AdminUserCreateDto) {
    return this.adminService.createAdminUser(dto);
  }

  @Patch('/admin-users/:id')
  updateAdminUser(
    @Param('id') id: string,
    @Body() dto: AdminUserUpdateDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.adminService.updateAdminUser(id, dto, req.user?.sub ?? null);
  }

  @Delete('/admin-users/:id')
  deleteAdminUser(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    return this.adminService.deleteAdminUser(id, req.user?.sub ?? null);
  }
}




