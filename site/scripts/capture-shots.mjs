// Captures the app screens the site shows (site/public/shots/<page>.webp, -phone.webp, -thumb.webp).
//
//   npm i --no-save playwright-core sharp
//   npm run dev:demo            (or build:demo + preview:demo)
//   npm run shots
//
// The captures come from the demo build: its fake Api serves a tidy household with a photo for
// every product and recipe, seeded around today's date, so the screens never show test data,
// missing images or a week long gone. Re-run it now and then so the dates stay current.
//
//   SHOT_BASE   the demo app (default http://localhost:5175)
//   SHOT_DATE   the moment the app believes it is, e.g. 2026-11-19T10:30 (default: this week's Thursday, 10:30)
//   SHOT_ONLY   comma-separated page keys to retake (default: all)
//   SHOT_OUT    output folder (default site/public/shots)
// Needs Microsoft Edge (or set SHOT_CHANNEL=chrome).

import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const base = (process.env.SHOT_BASE ?? "http://localhost:5175").replace(/\/+$/, "");
const out = process.env.SHOT_OUT ?? join(dirname(fileURLToPath(import.meta.url)), "..", "public", "shots");
mkdirSync(out, { recursive: true });

// Thursday of the current week by default: the week already has meals cooked and logged
// (on a Monday, Nutrition would be empty) and the dates stay within a few days of today.
const now = new Date();
const thursday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + 3, 10, 30);
const date = process.env.SHOT_DATE ? new Date(process.env.SHOT_DATE) : thursday;
if (Number.isNaN(date.getTime())) throw new Error(`SHOT_DATE is not a date: ${process.env.SHOT_DATE}`);

/** Page key (site/i18n FEATURE_KEYS) → app path. */
const PAGES = {
  today: "/",
  plan: "/plano",
  pantry: "/despensa",
  lists: "/listas/sl-domingo",
  cook: "/cozinhar",
  recipes: "/receitas",
  templates: "/ementas",
  nutrition: "/nutricao",
  products: "/produtos",
  promotions: "/promocoes",
  household: "/casa",
};
/** What to do on a page before the capture, e.g. open a panel. `phone` is true on the phone capture. */
const PREPARE = {
  // The list with the store comparison open: on the phone it sits below the list, so scroll to it.
  lists: async (page, phone) => {
    await page.getByRole("button", { name: "Comparar lojas" }).click();
    await page.waitForLoadState("networkidle");
    await page.locator(".store-grid").waitFor();
    if (phone) {
      await page.locator(".comparison-panel").evaluate((panel) => {
        window.scrollTo(0, panel.getBoundingClientRect().top + window.scrollY - 16);
      });
    }
  },
};

const only = process.env.SHOT_ONLY?.split(",").map((s) => s.trim()).filter(Boolean);
const keys = Object.keys(PAGES).filter((k) => !only || only.includes(k));

const hideChrome = `
  *{animation:none!important;transition:none!important;caret-color:transparent!important}
  html{scroll-behavior:auto!important}
  .app-notice,.demo-banner{display:none!important}
`;

const browser = await chromium.launch({ channel: process.env.SHOT_CHANNEL ?? "msedge", headless: true });

async function session(width, height, scale) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, locale: "pt-PT", colorScheme: "light" });
  await ctx.clock.setFixedTime(date);
  await ctx.addInitScript(() => {
    window.localStorage.setItem("domios.language", "pt");
    // Sem o diálogo de boas-vindas do tour guiado: as capturas mostram os dados de exemplo.
    window.localStorage.setItem("domios.demo.tour", JSON.stringify({ status: "off" }));
  });
  const page = await ctx.newPage();
  // First visit seeds the demo household and signs in; the next load starts from it.
  await page.goto(`${base}/`);
  await page.waitForLoadState("networkidle");
  return page;
}

/** Waits until every image in the viewport has loaded (lazy ones included). */
async function imagesReady(page) {
  await page.waitForFunction(
    () =>
      [...document.images]
        .filter((img) => {
          const r = img.getBoundingClientRect();
          return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        })
        .every((img) => img.complete && img.naturalWidth > 0),
    null,
    { timeout: 15000 },
  );
}

async function capture(page, key, phone) {
  await page.goto(`${base}${PAGES[key]}`);
  await page.addStyleTag({ content: hideChrome });
  await page.waitForLoadState("networkidle");
  await PREPARE[key]?.(page, phone);
  await page.waitForTimeout(600);
  await imagesReady(page);
  return page.screenshot();
}

const desktop = await session(1440, 900, 1);
for (const key of keys) {
  const png = await capture(desktop, key, false);
  await sharp(png).webp({ quality: 80 }).toFile(join(out, `${key}.webp`));
  await sharp(png).resize(480, 300).webp({ quality: 78 }).toFile(join(out, `${key}-thumb.webp`));
  console.log("ok", key);
}

// Phone captures at 2x so they stay sharp in the phone frame.
const phone = await session(390, 844, 2);
for (const key of keys) {
  const png = await capture(phone, key, true);
  await sharp(png).webp({ quality: 78 }).toFile(join(out, `${key}-phone.webp`));
  console.log("ok", `${key}-phone`);
}

await browser.close();
