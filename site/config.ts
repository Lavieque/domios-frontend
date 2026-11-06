/** Where the app lives (app.domios.pt). Build-time, like the Api URL. */
export const APP_URL = ((import.meta.env.VITE_APP_URL as string | undefined) || "https://app.domios.pt").replace(/\/+$/, "");

export const APP_LOGIN_URL = `${APP_URL}/entrar`;

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export function apiBase(): string {
  if (!API_BASE) throw new Error("VITE_API_BASE_URL não está definida — ver .env.example.");
  return API_BASE.replace(/\/+$/, "");
}
