/** Where the app lives (app.domios.pt). Build-time, like the Api URL. */
export const APP_URL = ((import.meta.env.VITE_APP_URL as string | undefined) || "https://app.domios.pt").replace(/\/+$/, "");

export const APP_LOGIN_URL = `${APP_URL}/entrar`;

/** The demo build (npm run build:demo): the app on sample data, no account needed. */
export const DEMO_URL = ((import.meta.env.VITE_DEMO_URL as string | undefined) || "https://demo.domios.pt").replace(/\/+$/, "");

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export function apiBase(): string {
  if (!API_BASE) throw new Error("VITE_API_BASE_URL não está definida — ver .env.example.");
  return API_BASE.replace(/\/+$/, "");
}
