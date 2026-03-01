const normalizeRoute = (value: string | undefined, fallback: string): string => {
  const raw = (value ?? "").trim();
  const withLeadingSlash = raw ? (raw.startsWith("/") ? raw : `/${raw}`) : fallback;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
};

export const LOGIN_ROUTE = normalizeRoute(import.meta.env.VITE_LOGIN_PATH, "/admin/login");
export const ADMIN_ROUTE = normalizeRoute(import.meta.env.VITE_ADMIN_PATH, "/admin");
