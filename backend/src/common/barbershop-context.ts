import { ForbiddenException } from '@nestjs/common';

const DEFAULT_BARBERSHOP_ID = '00000000-0000-0000-0000-000000000001';
const UUID_V4_OR_GENERIC_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuid(raw?: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const candidate = raw.trim();
  return UUID_V4_OR_GENERIC_REGEX.test(candidate) ? candidate : null;
}

export function resolveBarbershopId(headerValue?: unknown): string {
  const fromHeader = normalizeUuid(headerValue);
  if (fromHeader) {
    return fromHeader;
  }

  const envDefault = normalizeUuid(process.env.DEFAULT_BARBERSHOP_ID ?? DEFAULT_BARBERSHOP_ID);
  if (envDefault) {
    return envDefault;
  }

  return DEFAULT_BARBERSHOP_ID;
}

export function resolveAdminBarbershopId(headerValue?: unknown, jwtBarbershopId?: unknown): string {
  const fromHeader = normalizeUuid(headerValue);
  const fromJwt = normalizeUuid(jwtBarbershopId);

  if (fromHeader && fromJwt && fromHeader !== fromJwt) {
    throw new ForbiddenException('Contexto de sucursal invalido para el usuario autenticado');
  }

  if (fromJwt) {
    return fromJwt;
  }

  if (fromHeader) {
    return fromHeader;
  }

  const envDefault = normalizeUuid(process.env.DEFAULT_BARBERSHOP_ID ?? DEFAULT_BARBERSHOP_ID);
  if (envDefault) {
    return envDefault;
  }

  return DEFAULT_BARBERSHOP_ID;
}
