import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AppointmentStatus } from '../common/constants';

@Entity({ name: 'appointments' })
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @Column({ name: 'appointment_at', type: 'timestamptz' })
  appointmentAt!: Date;

  @Column({ type: 'varchar', length: 20 })
  status!: AppointmentStatus;

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

