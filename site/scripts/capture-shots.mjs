// Captures the app screens the site shows (site/public/shots/<menu>.png).
//
//   npm i --no-save playwright-core
//   SHOT_EMAIL=... SHOT_PASSWORD=... node site/scripts/capture-shots.mjs
//
// Point SHOT_BASE at an app whose Api holds real catalog data and a tidy demo household
// (a household with a weekly plan, some pantry items and a shopping list). Never use the
// local dev database: its names are test hashes. Needs Microsoft Edge (or set SHOT_CHANNEL=chrome).
// Nothing here is committed with credentials: they come from the environment only.

import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const email = process.env.SHOT_EMAIL;
const password = process.env.SHOT_PASSWORD;
if (!email || !password) throw new Error("Set SHOT_EMAIL and SHOT_PASSWORD (a demo account).");

const base = (process.env.SHOT_BASE ?? "http://localhost:5173").replace(/\/+$/, "");
const out = process.env.SHOT_OUT ?? join(dirname(fileURLToPath(import.meta.url)), "..", "public", "shots");
mkdirSync(out, { recursive: true });

const hideChrome = `
  *{animation:none!important;transition:none!important;caret-color:transparent!important}
  html{scroll-behavior:auto!important}
  .app-notice{display:none!important}
`;

const browser = await chromium.launch({ channel: process.env.SHOT_CHANNEL ?? "msedge", headless: true });

async function session(width, height, scale) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, locale: "pt-PT", colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${base}/entrar`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"), { timeout: 15000 });
  return page;
}

async function shot(page, path, name) {
  await page.goto(`${base}${path}`);
  await page.addStyleTag({ content: hideChrome });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log("ok", name);
}

const desktop = await session(1280, 800, 1);
await shot(desktop, "/", "today");
await shot(desktop, "/plano", "plan");
await shot(desktop, "/despensa", "pantry");
await shot(desktop, "/produtos", "products");
await shot(desktop, "/promocoes", "promotions");
await shot(desktop, "/receitas", "recipes");
await shot(desktop, "/casa", "household");

// The shopping list is a phone screen: first open list.
const phone = await session(390, 844, 2);
await phone.goto(`${base}/listas`);
await phone.waitForLoadState("networkidle");
const first = phone.locator('a[href^="/listas/"]').first();
await shot(phone, (await first.count()) ? await first.getAttribute("href") : "/listas", "lists");

await browser.close();
