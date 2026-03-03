import { api } from './api';
import type { LoginResponse } from './types';

const TOKEN_KEY = 'auth_token';
const EXPIRY_KEY = 'auth_expiry';

export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  const legacyToken = localStorage.getItem(TOKEN_KEY);
  const legacyExpiry = localStorage.getItem(EXPIRY_KEY);
  if (legacyToken || legacyExpiry) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
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

export function setLoginToken(res: LoginResponse): void {
  sessionStorage.setItem(TOKEN_KEY, res.accessToken);
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + res.expiresInSeconds * 1000));
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export async function loginWithFirebase(idToken: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/auth/login/firebase', { idToken });
  setLoginToken(res);
  return res;
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
