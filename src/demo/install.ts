// Turns the app into the demo: every request to the Api is answered in the
// browser by the fake Api in router.ts, and the first visit starts signed in.

import { clearApiCache } from "../api/cache";
import { subscribeLanguage } from "../i18n/language";
import { SESSION_STORAGE_KEY } from "../auth/session";
import { DemoHttpError, handle } from "./router";
import { DEMO_EMAIL, DEMO_STATE_KEY, DEMO_USER_ID, getState, resetState } from "./state";
import { DEMO_API_EVENT, clearTour, freshTour, writeTour, type DemoApiDetail } from "./tour";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, "");

function demoSession() {
  const far = new Date(Date.now() + 365 * 86_400_000).toISOString();
  return {
    userId: DEMO_USER_ID,
    email: DEMO_EMAIL,
    accessToken: "demo-access-token",
    accessTokenExpiresAt: far,
    refreshToken: "demo-refresh-token",
    refreshTokenExpiresAt: far,
    emailVerified: true,
  };
}

function signIn() {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoSession()));
}

/**
 * Small pause so loading states show as they do against the real Api. To test a slow Api,
 * set `localStorage["domios.demo.latency"]` to the milliseconds each request should take.
 */
function latencyMs(): number {
  try {
    const forced = Number(window.localStorage.getItem("domios.demo.latency"));
    if (forced > 0) return forced;
  } catch {
    // No localStorage: the usual pause.
  }
  return 60 + Math.random() * 120;
}
const latency = () => new Promise((resolve) => setTimeout(resolve, latencyMs()));

function json(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}

export function installDemo(): void {
  const firstVisit = window.localStorage.getItem(DEMO_STATE_KEY) === null;
  getState();
  if (firstVisit) signIn();

  // Sample data (products, recipes, suggestions) follows the app language. The
  // app keeps several per-page caches of it, so a reload is the clean switch.
  subscribeLanguage(() => window.location.reload());

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!href.startsWith(BASE_URL)) return realFetch(input, init);

    const url = new URL(href);
    const path = url.pathname.slice(new URL(BASE_URL).pathname.length) || "/";
    const method = (init?.method ?? "GET").toUpperCase();
    let body: unknown;
    let blob: Blob | null = null;
    if (init?.body instanceof Blob) blob = init.body;
    else if (typeof init?.body === "string" && init.body) body = JSON.parse(init.body);

    await latency();
    try {
      const result = await handle(method, path, url.searchParams, body, blob);
      // For the guided tour: a step finishes when the visitor does what it asks.
      window.dispatchEvent(new CustomEvent<DemoApiDetail>(DEMO_API_EVENT, { detail: { method, path, body, result } }));
      if (result instanceof Blob) return new Response(result, { status: 200, headers: { "Content-Type": result.type } });
      if (result === undefined) return new Response(null, { status: 204 });
      return json(200, result);
    } catch (error) {
      if (error instanceof DemoHttpError) return json(error.status, { type: error.type, title: error.message, status: error.status });
      console.error("[demo]", method, path, error);
      return json(500, { type: "demo-error", title: String(error), status: 500 });
    }
  };
}

function forgetHousehold() {
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith("domios.household")) window.localStorage.removeItem(key);
  }
}

/**
 * Back to the sample data, signed in again, on the Today page. The welcome
 * dialog shows again, unless `skipTour` (the visitor asked for the sample data).
 */
export function resetDemo(options: { skipTour?: boolean } = {}): void {
  resetState();
  forgetHousehold();
  if (options.skipTour) writeTour(freshTour("off"));
  else clearTour();
  signIn();
  clearApiCache();
  window.location.assign("/");
}

/**
 * Starts the guided tour on a new, empty account: no household, plan, lists or
 * pantry. Opens the household form with the visitor's name already in it.
 */
export function startTour(name: string): void {
  resetState(true);
  forgetHousehold();
  writeTour(freshTour("active", name));
  signIn();
  clearApiCache();
  // React Router reads `usr` from history.state as the location state, and a
  // reload keeps history.state: the form gets the name after the clean start.
  window.history.replaceState({ usr: { memberName: name }, key: "demo-tour", idx: 0 }, "", "/casa/nova");
  window.location.reload();
}
