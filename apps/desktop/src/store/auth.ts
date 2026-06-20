const TOKEN_KEY = "token";
const LEGACY_ACCESS_KEY = "acs_desktop_access_token";

export interface AuthStore {
  token: string | null;
  setToken: (token: string | null) => void;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LEGACY_ACCESS_KEY, token);
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_KEY);
}

export function clearToken(): void {
  setToken(null);
}

export const authStore: AuthStore = {
  get token() {
    return getToken();
  },
  setToken,
};
