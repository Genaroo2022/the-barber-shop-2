import { IsDateString, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreatePublicAppointmentDto {
  @IsString()
  @Length(2, 120)
  clientName!: string;

  @IsString()
  @Length(7, 40)
  clientPhone!: string;

  @IsUUID()
  serviceId!: string;

  @IsDateString()
  appointmentAt!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  notes?: string;
}

