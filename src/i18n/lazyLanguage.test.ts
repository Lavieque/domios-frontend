import { describe, expect, it } from "vitest";
import { getLanguage, loadLanguage, setLanguage, tr } from ".";
import { pt } from "./pt";

describe("dicionários por língua", () => {
  it("o português está sempre carregado", () => {
    expect(tr()).toBe(pt);
  });

  it("mudar para inglês espera pelo dicionário e só depois muda", async () => {
    const switching = setLanguage("en");
    // Até o inglês chegar, a app continua em português.
    expect(getLanguage()).toBe("pt");
    await switching;
    expect(getLanguage()).toBe("en");
    expect(tr()).not.toBe(pt);
    expect(Object.keys(tr())).toEqual(Object.keys(pt));
  });

  it("um pedido mais recente ganha a um que ainda carrega", async () => {
    await setLanguage("pt");
    await loadLanguage("en");
    // Já carregado: muda logo, sem esperar.
    void setLanguage("en");
    expect(getLanguage()).toBe("en");
    await setLanguage("pt");
    expect(getLanguage()).toBe("pt");
  });
});
