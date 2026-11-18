import { expect, test, type Page } from "@playwright/test";

/** Os passos do tour já feitos, como a demo os guarda. */
async function doneSteps(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("domios.demo.tour");
    return raw ? ((JSON.parse(raw) as { done?: string[] }).done ?? []) : [];
  });
}

const stepDone = (page: Page, id: string) => expect.poll(() => doneSteps(page)).toContain(id);
const card = (page: Page) => page.locator(".demo-tour-card");
/** O botão principal do cartão do tour leva ao ecrã do passo seguinte. */
const next = (page: Page) => card(page).locator(".button-primary").click();

test("o visitante monta a sua casa pelo tour guiado, do nome ao jantar", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));

  await page.goto("/");
  const welcome = page.locator(".demo-tour-welcome");
  await expect(welcome).toBeVisible();
  await welcome.locator("input").fill("Marta");
  await welcome.locator("button[type=submit]").click();

  // 1. A casa: o nome dado na boas-vindas já vem preenchido.
  await page.waitForURL("**/casa/nova");
  const form = page.locator(".create-household-form");
  await expect(form.locator("input").nth(1)).toHaveValue("Marta");
  await form.locator("input").first().fill("Casa da Marta");
  await form.locator("button[type=submit]").click();
  await stepDone(page, "household");

  // 2. Membros: quem vive sozinho salta o passo.
  await page.getByRole("button", { name: /Vivo sozinho/ }).click();

  // 3. O plano a partir de uma ementa.
  await page.goto("/ementas");
  await page.getByText("Semana em família").first().click();
  await page.getByRole("button", { name: /Aplicar ao plano/ }).first().click();
  await stepDone(page, "plan");

  // 4. O que falta vai para a lista.
  await next(page);
  await page.getByRole("button", { name: /Pôr o que falta na lista/ }).first().click();
  await stepDone(page, "list");

  // 5. Comparar lojas.
  await next(page);
  await page.getByRole("button", { name: /Comparar lojas/ }).first().click();
  await stepDone(page, "compare");

  // 6. Comprado: riscar um item.
  await page.locator(".list-row .item-check input[type=checkbox]").first().click();
  await stepDone(page, "buy");

  // 7. O comprado vai para a despensa.
  await page.locator(".store-in-pantry").getByRole("button", { name: /Pôr na despensa/ }).click();
  await stepDone(page, "pantry");

  // 8. Cozinhar o jantar de hoje.
  await next(page);
  await page.getByRole("button", { name: /Cozinhei/ }).first().click();
  const register = page.getByRole("button", { name: /^Registar/ });
  if (await register.count()) await register.first().click();
  await stepDone(page, "cook");

  // A receita feita fica marcada na lista de receitas.
  await page.goto("/receitas");
  await expect(page.locator(".cooked-mark").first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("saltar as boas-vindas mostra a demo já preenchida", async ({ page }) => {
  await page.goto("/");
  await page.locator(".demo-tour-welcome").getByRole("button", { name: /Saltar|Ver a demo/ }).click();
  await expect(page.locator(".demo-tour-welcome")).toHaveCount(0);
  await page.goto("/despensa");
  await expect(page.locator(".pantry-when").first()).toBeVisible();
});
