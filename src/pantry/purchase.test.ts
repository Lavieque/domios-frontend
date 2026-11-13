import { describe, expect, it } from "vitest";
import { ChainStatus, type ChainDto } from "../api/types";
import { describePurchase } from "./purchase";

const chains: ChainDto[] = [{ chainId: "c1", name: "Continente", logoUrl: null, status: ChainStatus.Active }];

// O Intl separa o valor do símbolo com um espaço rígido.
const plain = (text: string | null) => text?.replace(/\s/g, " ") ?? null;

describe("describePurchase", () => {
  it("preço escrito e cadeia", () => {
    const text = describePurchase(
      { purchasedPrice: { amount: 1.29, currency: "EUR" }, purchasedChainId: "c1", purchasedPriceSource: "Typed" },
      chains,
    );
    expect(plain(text)).toBe("Comprado no Continente · 1,29 €");
  });

  it("marca o preço da prateleira", () => {
    const text = describePurchase(
      { purchasedPrice: { amount: 2, currency: "EUR" }, purchasedChainId: null, purchasedPriceSource: "Offer" },
      chains,
    );
    expect(plain(text)).toBe("Pago 2,00 € (prateleira)");
  });

  it("só a cadeia, sem preço", () => {
    expect(describePurchase({ purchasedPrice: null, purchasedChainId: "c1" }, chains)).toBe("Comprado no Continente");
  });

  it("cadeia desconhecida ou cadeias por chegar ficam de fora", () => {
    expect(describePurchase({ purchasedPrice: null, purchasedChainId: "outra" }, chains)).toBeNull();
    expect(describePurchase({ purchasedPrice: null, purchasedChainId: "c1" }, null)).toBeNull();
  });

  it("itens antigos sem os campos novos", () => {
    expect(describePurchase({ purchasedPrice: null }, chains)).toBeNull();
  });

  it("loja física com o nome da cadeia", () => {
    const text = describePurchase(
      { purchasedPrice: null, purchasedChainId: "c1", purchasedPhysicalStoreName: "Continente Bom Dia Benfica" },
      chains,
    );
    expect(text).toBe("Comprado em Continente Bom Dia Benfica");
  });

  it("loja física sem o nome da cadeia", () => {
    const text = describePurchase(
      { purchasedPrice: { amount: 1.29, currency: "EUR" }, purchasedChainId: "c1", purchasedPhysicalStoreName: "Loja Telheiras" },
      chains,
    );
    expect(plain(text)).toBe("Comprado no Continente (Loja Telheiras) · 1,29 €");
  });
});
