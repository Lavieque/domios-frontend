import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openFilledDemo } from "./helpers.ts";

// Os ecrãs principais da demo preenchida, passados pelo axe. Só as falhas sérias e
// críticas fazem o teste falhar; as menores ficam para rever à mão.
const routes = [
  "/",
  "/plano",
  "/listas",
  "/despensa",
  "/despensa/adicionar",
  "/despensa/desperdicio",
  "/receitas",
  "/cozinhar",
  "/cozinhar/feitas",
  "/ementas",
  "/produtos",
  "/promocoes",
  "/lojas",
  "/gastos",
  "/nutricao",
  "/casa",
  "/casa/historico",
  "/conta",
];

// Um só teste: a demo abre uma vez e cada ecrã é um passo, com as falhas de todos no fim.
test("os ecrãs principais não têm falhas de acessibilidade sérias", async ({ page }) => {
  test.setTimeout(180_000);
  await openFilledDemo(page);
  const failures: string[] = [];
  for (const route of routes) {
    await test.step(route, async () => {
      await page.goto(route);
      await page.locator("main").first().waitFor();
      // Espera que os esqueletos de carregamento saiam antes de analisar.
      await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      for (const v of violations) {
        if (v.impact !== "serious" && v.impact !== "critical") continue;
        const where = v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ");
        failures.push(`${route} ${v.id}: ${v.help} (${v.nodes.length}) ${where}`);
      }
    });
  }
  expect(failures).toEqual([]);
});
