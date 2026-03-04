import { IsBoolean, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { AppointmentStatus } from '../common/constants';

export class UpdateAppointmentStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
  status!: AppointmentStatus;
}

export class UpdateAppointmentBarberDto {
  @IsUUID()
  barberId!: string;
}

export class AdminClientUpsertDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(7, 40)
  phone!: string;
}

export class MergeClientsDto {
  @IsUUID()
  sourceClientId!: string;

  @IsUUID()
  targetClientId!: string;
}

export class AdminServiceUpsertDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsBoolean()
  active!: boolean;
}

export class AdminBarberUpsertDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsNumber()
  @Min(0)
  sortOrder!: number;

  @IsBoolean()
  active!: boolean;
}

export class AdminGalleryImageUpsertDto {
  @IsString()
  @Length(2, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  category?: string;

  @IsString()
  @Length(5, 500)
  imageUrl!: string;

  @IsNumber()
  sortOrder!: number;

  @IsBoolean()
  active!: boolean;
}

export class CreateManualIncomeDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @Min(0)
  tipAmount!: number;

  @IsDateString()
  occurredOn!: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  notes?: string;
}

export class AdminUserCreateDto {
  @IsEmail()
  @Length(5, 120)
  email!: string;

  @IsOptional()
  @IsString()
  @Length(8, 120)
  password?: string;

  @IsBoolean()
  active!: boolean;
}

export class AdminUserUpdateDto {
  @IsOptional()
  @IsEmail()
  @Length(5, 120)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(8, 120)
  password?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
