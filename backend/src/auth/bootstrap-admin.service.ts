import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = String(process.env.BOOTSTRAP_ADMIN_ENABLED ?? 'false').toLowerCase() === 'true';
    if (!enabled) return;

    await this.waitForAdminUsersTable();

    const total = await this.adminRepo.count();
    if (total > 0) return;

    const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? '').trim().toLowerCase();
    const password = (process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '').trim();
    if (!email || !password) {
      throw new Error('BOOTSTRAP_ADMIN_ENABLED=true requiere BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD');
    }
    if (password.length < 12) {
      throw new Error('BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 12 caracteres');
    }

    const hash = await bcrypt.hash(password, 10);
    await this.adminRepo.save(
      this.adminRepo.create({
        email,
        passwordHash: hash,
        role: 'ADMIN',
        active: true,
      }),
    );

    this.logger.warn(`Admin inicial creado: ${email}`);
  }

  private async waitForAdminUsersTable(): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const rows = await this.dataSource.query(`
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'admin_users'
        LIMIT 1
      `);

      if (rows.length > 0) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Tabla admin_users no disponible luego de esperar migraciones');
  }
}
