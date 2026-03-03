const DEFAULT_BARBERSHOP_ID = "00000000-0000-0000-0000-000000000001";

const normalizeValue = (value: string | undefined, fallback: string): string => {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
};

export const BARBERSHOP_ID = normalizeValue(import.meta.env.VITE_BARBERSHOP_ID, DEFAULT_BARBERSHOP_ID);

