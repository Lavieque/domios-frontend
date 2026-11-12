import { describe, expect, it } from "vitest";
import type { StoreComparisonDto, StoreComparisonStoreDto } from "../api/shopping";
import { planForStore, planFromSplit, toPlanRequest } from "./storePlan";

function store(storeId: string, chainId: string, physicalStoreId: string | null): StoreComparisonStoreDto {
  return {
    storeId,
    storeName: storeId,
    chainId,
    chainName: chainId,
    coveredItemCount: 2,
    total: 10,
    cardTotal: 10,
    missingItemIds: [],
    items: [],
    nearestStore: physicalStoreId ? { physicalStoreId, name: physicalStoreId, address: null, roadKm: 1, roundTripKm: 2, openingHours: null } : null,
    travelCost: physicalStoreId ? 0.6 : null,
  };
}

const line = (storeId: string, itemIds: string[]) => ({ itemId: itemIds[0], itemIds, storeId, productId: "p", lineTotal: 1 });

function comparison(travel: boolean): StoreComparisonDto {
  return {
    shoppingListId: "l",
    currency: "EUR",
    itemCount: 4,
    unpricedItems: [],
    stores: [store("s-lidl", "lidl", "lidl-perto"), store("s-cont", "continente", "cont-perto")],
    split: {
      coveredItemCount: 3,
      storeCount: 2,
      total: 9,
      cardTotal: 9,
      bestStoreId: "s-lidl",
      savingVsBestStore: 1,
      cardSavingVsBestStore: 1,
      items: [line("s-lidl", ["a"]), line("s-cont", ["b", "c"])],
    },
    splitWithTravel: travel
      ? {
          coveredItemCount: 3,
          storeCount: 2,
          total: 9,
          cardTotal: 9,
          bestStoreId: "s-lidl",
          savingVsBestStore: 1,
          cardSavingVsBestStore: 1,
          items: [line("s-lidl", ["a", "b"]), line("s-cont", ["c"])],
          route: ["lidl-perto", "cont-perto"],
          routeKm: 3,
          travelCost: 1,
          totalWithTravel: 10,
          cardTotalWithTravel: 10,
        }
      : null,
    travel: travel ? { status: "Included", origin: { latitude: 0, longitude: 0 }, costPerKm: 0.3, roadFactor: 1.3, radiusKm: 10 } : undefined,
  };
}

describe("plano de compra a partir da comparação", () => {
  it("numa loja: a lista fica nela e os itens perdem as exceções", () => {
    expect(planForStore(comparison(false), "s-cont", ["a", "b"])).toEqual({
      list: { chainId: "continente", physicalStoreId: null },
      items: [
        { itemId: "a", choice: null },
        { itemId: "b", choice: null },
      ],
      travelCost: null,
    });
  });

  it("com a deslocação contada, guarda a loja física mais perto e a ida à loja", () => {
    const plan = planForStore(comparison(true), "s-lidl", []);
    expect(plan?.list).toEqual({ chainId: "lidl", physicalStoreId: "lidl-perto" });
    expect(plan?.travelCost).toBe(0.6);
  });

  it("na divisão, a lista fica na loja com mais itens e os outros ganham exceção; sem preço segue a lista", () => {
    expect(planFromSplit(comparison(false), ["a", "b", "c", "d"])).toEqual({
      list: { chainId: "continente", physicalStoreId: null },
      items: [
        { itemId: "a", choice: { chainId: "lidl", physicalStoreId: null } },
        { itemId: "b", choice: null },
        { itemId: "c", choice: null },
        { itemId: "d", choice: null },
      ],
      travelCost: null,
    });
  });

  it("com a deslocação contada, segue a divisão que a conta", () => {
    expect(planFromSplit(comparison(true), ["a", "b", "c"])).toEqual({
      list: { chainId: "lidl", physicalStoreId: "lidl-perto" },
      items: [
        { itemId: "a", choice: null },
        { itemId: "b", choice: null },
        { itemId: "c", choice: { chainId: "continente", physicalStoreId: "cont-perto" } },
      ],
      travelCost: 1,
    });
  });

  it("o pedido leva só as linhas que vão para outra loja", () => {
    expect(toPlanRequest(planFromSplit(comparison(true), ["a", "b", "c"])!)).toEqual({
      list: { chainId: "lidl", physicalStoreId: "lidl-perto" },
      items: [{ itemId: "c", chainId: "continente", physicalStoreId: "cont-perto" }],
      travelCost: 1,
    });
  });
});
