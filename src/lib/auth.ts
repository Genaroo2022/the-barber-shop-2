import { api } from "./api";
import type { LoginRequest, LoginResponse } from "./types";

const TOKEN_KEY = "auth_token";
const EXPIRY_KEY = "auth_expiry";

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > Number(expiry)) {
    logout();
    return null;
  }
  return token;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/api/auth/login", credentials);
  localStorage.setItem(TOKEN_KEY, res.accessToken);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + res.expiresInSeconds * 1000));
  return res;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
