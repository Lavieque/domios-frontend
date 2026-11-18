import type { Page } from "@playwright/test";

/** Abre a demo já preenchida, sem o tour: o mesmo que carregar em "Saltar". */
export async function openFilledDemo(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator(".demo-tour-welcome").getByRole("button", { name: /Saltar|Ver a demo/ }).click();
  await page.locator(".demo-tour-welcome").waitFor({ state: "detached" });
}

/** Junta os erros da página e da consola, para o teste confirmar no fim que não houve nenhum. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  return errors;
}
