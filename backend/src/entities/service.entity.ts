import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'services' })
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  name!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

