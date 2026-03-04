import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'admin_users' })
export class AdminUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'barbershop_id', type: 'uuid' })
  barbershopId!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 120 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 30, default: 'ADMIN' })
  role!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'firebase_uid', type: 'varchar', length: 128, nullable: true })
  firebaseUid!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

