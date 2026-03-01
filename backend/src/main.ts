import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MigrationService } from './database/migration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.get(MigrationService).runMigrations();

  app.enableCors({
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map((v) => v.trim()),
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port);
}

bootstrap();
