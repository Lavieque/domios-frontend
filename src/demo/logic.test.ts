import { describe, expect, it } from "vitest";
import { productById } from "./catalog";
import { offersFor, priceHistoryDto, priceInsight, storeOfferDto } from "./logic";

describe("priceHistoryDto (demo)", () => {
  const offers = offersFor(productById.get("p-azeite")!);

  it("tem tantas observações quantas o veredicto diz, da mais antiga a hoje", () => {
    for (const offer of offers) {
      const history = priceHistoryDto(offer);
      expect(history).toHaveLength(priceInsight(offer).observationCount);
      const times = history.map((o) => Date.parse(o.observedAt));
      expect([...times].sort((a, b) => a - b)).toEqual(times);
    }
  });

  it("a última observação é o preço e a promoção que a loja mostra agora", () => {
    for (const offer of offers) {
      const last = priceHistoryDto(offer).at(-1)!;
      const shown = storeOfferDto(offer).latestPrice;
      expect(last.price).toEqual(shown.price);
      expect(last.promotionId).toBe(shown.promotionId);
    }
  });
});
