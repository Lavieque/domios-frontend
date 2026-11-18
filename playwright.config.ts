import { defineConfig, devices } from "@playwright/test";

// O tour da demo de ponta a ponta, contra o servidor de desenvolvimento da demo
// (a Api é falsa e corre no browser). Localmente pode usar um browser já
// instalado: PW_CHANNEL=msedge npm run e2e.
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:5175",
    locale: "pt-PT",
    viewport: { width: 1360, height: 860 },
    channel: process.env.PW_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL || undefined } }],
  webServer: {
    command: "npm run dev:demo",
    url: "http://localhost:5175",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
