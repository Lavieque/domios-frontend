import { expect, test } from "@playwright/test";
import { collectErrors, openFilledDemo } from "./helpers.ts";

// Fluxos da demo preenchida fora do tour: cada um começa numa demo nova.

test("adicionar à despensa a partir da procura", async ({ page }) => {
  const errors = collectErrors(page);
  await openFilledDemo(page);
  await page.goto("/despensa/adicionar");
  // O cabeçalho também tem uma procura: usa-se a da página.
  await page.locator("main").getByRole("searchbox").fill("arroz");
  const first = page.locator(".product-results button").first();
  await expect(first).toBeVisible();
  const name = (await first.locator("strong").textContent())!.trim();
  await first.click();
  await page.locator(".add-submit button[type=submit]").click();
  await page.waitForURL("**/despensa");
  await expect(page.getByText(name).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("criar uma lista de compras nova", async ({ page }) => {
  const errors = collectErrors(page);
  await openFilledDemo(page);
  await page.goto("/listas");
  const form = page.locator(".new-list-form");
  await form.getByRole("textbox").fill("Jantar de anos");
  await form.locator("button[type=submit]").click();
  await expect(page.getByText("Jantar de anos").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("procurar no catálogo de produtos", async ({ page }) => {
  const errors = collectErrors(page);
  await openFilledDemo(page);
  await page.goto("/produtos");
  await page.locator("main").getByRole("searchbox").fill("leite");
  await expect(page.getByRole("link", { name: /leite/i }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("mudar a conta para inglês carrega o dicionário e muda a página", async ({ page }) => {
  const errors = collectErrors(page);
  await openFilledDemo(page);
  // Com sessão, a língua é a da conta: muda-se na página da conta.
  await page.goto("/conta");
  await page.locator("main button[lang=en]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  await page.goto("/despensa");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/pantry/i);
  expect(errors).toEqual([]);
});
