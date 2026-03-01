import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private hasRun = false;

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.runMigrations();
  }

  async runMigrations(): Promise<void> {
    if (this.hasRun) return;
    this.hasRun = true;
    await this.ensureMigrationsTable();
    await this.runPendingMigrations();
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(120) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  private async runPendingMigrations(): Promise<void> {
    const sqlDir = await this.resolveMigrationsDir();
    const files = (await fs.readdir(sqlDir)).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
      const rows = await this.dataSource.query('SELECT version FROM schema_migrations WHERE version = $1', [file]);
      if (rows.length > 0) {
        continue;
      }

      const fullPath = path.join(sqlDir, file);
      const sql = (await fs.readFile(fullPath, 'utf8')).replace(/^\uFEFF/, '');
      this.logger.log(`Running migration ${file}`);
      await this.dataSource.query(sql);
      await this.dataSource.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
    }
  }

  private async resolveMigrationsDir(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), 'migrations', 'sql'),
      path.resolve(__dirname, '..', 'migrations', 'sql'),
      path.resolve(process.cwd(), 'src', 'migrations', 'sql'),
    ];

    for (const candidate of candidates) {
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) {
          return candidate;
        }
      } catch {
        // try next
      }
    }

    throw new Error('No se encontró el directorio de migraciones SQL');
  }
}

