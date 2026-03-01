import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

const normalizePhone = (value: string) => value.replace(/\D/g, '');

@Entity({ name: 'clients' })
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 40 })
  phone!: string;

  @Index('ux_clients_phone_normalized', { unique: true })
  @Column({ name: 'phone_normalized', type: 'varchar', length: 20 })
  phoneNormalized!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  syncPhoneNormalized(): void {
    this.phoneNormalized = normalizePhone(this.phone ?? '');
  }
}

