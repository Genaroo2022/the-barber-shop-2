const DEFAULT_BARBERSHOP_ID = '00000000-0000-0000-0000-000000000001';
const UUID_V4_OR_GENERIC_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveBarbershopId(headerValue?: unknown): string {
  if (typeof headerValue === 'string') {
    const candidate = headerValue.trim();
    if (UUID_V4_OR_GENERIC_REGEX.test(candidate)) {
      return candidate;
    }
  }

  const envDefault = (process.env.DEFAULT_BARBERSHOP_ID ?? DEFAULT_BARBERSHOP_ID).trim();
  if (UUID_V4_OR_GENERIC_REGEX.test(envDefault)) {
    return envDefault;
  }

  return DEFAULT_BARBERSHOP_ID;
}

