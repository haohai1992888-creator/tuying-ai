import { getToken, setToken } from "../store/auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const REFRESH_KEY = "acs_desktop_refresh_token";

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function getAccessToken() {
  return getToken();
}

export function saveTokens(accessToken: string, refreshToken: string) {
  setToken(accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  setToken(null);
  localStorage.removeItem(REFRESH_KEY);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return (await res.json()) as ApiResponse<T>;
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (refreshToken) {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }
  clearTokens();
}
