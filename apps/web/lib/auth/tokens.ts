const ACCESS_TOKEN_KEY = 'petsocial_access_token';
const REFRESH_TOKEN_KEY = 'petsocial_refresh_token';

// Verificar si estamos en el cliente
const isClient = typeof window !== 'undefined';

export function getTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (!isClient) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isClient) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (!isClient) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (!isClient) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function hasValidTokens(): boolean {
  const { accessToken, refreshToken } = getTokens();
  return !!(accessToken && refreshToken);
}

// Decodificar JWT para verificar expiración (sin verificar firma)
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir a milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

export function getTokenPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as T;
  } catch {
    return null;
  }
}
