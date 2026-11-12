import { describe, expect, it } from "vitest";
import { OpportunityStatus, OpportunityType, type OpportunityDto } from "../api/opportunityTypes";
import { opportunityAction } from "./actions";

const base = {
  opportunityId: "o1",
  householdId: "h1",
  title: "",
  explanation: "",
  expectedBenefit: null,
  currency: null,
  critical: false,
  validUntil: "2026-10-30T23:00:00Z",
  status: OpportunityStatus.Open,
  presentedAt: null,
  createdAt: "2026-10-29T08:00:00Z",
};

describe("ação de uma oportunidade", () => {
  it("leva ao produto num bom preço e à lista numa divisão de compra", () => {
    const goodPrice: OpportunityDto = {
      ...base,
      type: OpportunityType.GoodPrice,
      payload: { productId: "p1", storeOfferId: "so1", storeId: "s1", current: 1, average: 1.5, label: "HistoricLow" },
    };
    const split: OpportunityDto = {
      ...base,
      type: OpportunityType.ShoppingListSplit,
      payload: { shoppingListId: "l1", storeCount: 2, bestStoreId: "s1", savingVsBestStore: 4.2 },
    };

    expect(opportunityAction(goodPrice)?.to).toBe("/produtos/p1");
    expect(opportunityAction(split)?.to).toBe("/listas/l1");
  });

  it("leva à despensa e ao plano nos tipos sem ecrã próprio", () => {
    const expiring: OpportunityDto = {
      ...base,
      type: OpportunityType.ExpiringPantryItem,
      payload: { pantryItemId: "pi1", productId: "p1", expiresAt: "2026-10-30" },
    };
    const missing: OpportunityDto = {
      ...base,
      type: OpportunityType.PlannedMealMissingItems,
      payload: { plannedMealId: "pm1", recipeId: "r1", date: "2026-10-30", missing: [] },
    };

    expect(opportunityAction(expiring)?.to).toBe("/despensa");
    expect(opportunityAction(missing)?.to).toBe("/plano");
  });

  it("leva ao produto quando está mais barato do que a casa pagou", () => {
    const belowLastPaid: OpportunityDto = {
      ...base,
      type: OpportunityType.BelowLastPaid,
      payload: {
        productId: "p2",
        storeOfferId: "so2",
        storeId: "s2",
        current: 0.99,
        lastPaid: 1.29,
        lastPaidAt: "2026-11-02T18:40:00Z",
        lastPaidChainId: "c1",
        priceSource: "Typed",
      },
    };

    expect(opportunityAction(belowLastPaid)).toEqual({ to: "/produtos/p2", linkLabel: "Ver o produto", doneLabel: "Comprei" });
  });

  it("não rebenta com um tipo que ainda não conhece", () => {
    const unknown = { ...base, type: 99, payload: {} } as unknown as OpportunityDto;

    expect(opportunityAction(unknown)).toBeNull();
  });
});
