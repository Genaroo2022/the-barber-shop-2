import { InternalServerErrorException } from '@nestjs/common';

const WEAK_JWT_SECRETS = new Set([
  'change-me-strong-secret',
  'dev-secret-change-me',
  'changeme',
  'secret',
  '123456',
]);

function assertNonEmpty(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    throw new InternalServerErrorException('Configuracion insegura: JWT_SECRET no definido');
  }
  return trimmed;
}

export function getRequiredJwtSecret(): string {
  const secret = assertNonEmpty(process.env.JWT_SECRET);
  if (secret.length < 32 || WEAK_JWT_SECRETS.has(secret)) {
    throw new InternalServerErrorException('Configuracion insegura: JWT_SECRET debil');
  }
  return secret;
}

