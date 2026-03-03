import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Index('ux_barbers_shop_name', ['barbershopId', 'name'], { unique: true })
@Entity({ name: 'barbers' })
export class BarberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'barbershop_id', type: 'uuid' })
  barbershopId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

