import { describe, expect, it } from "vitest";
import { rankStores } from "./storeRanking";

const near = { id: "near", coveredItemCount: 3, total: 42, totalWithTravel: 43.3 };
const far = { id: "far", coveredItemCount: 3, total: 40, totalWithTravel: 46 };
const none = { id: "none", coveredItemCount: 3, total: 30, totalWithTravel: null };
const partial = { id: "partial", coveredItemCount: 2, total: 10, totalWithTravel: 11 };

describe("ordem das lojas", () => {
  it("sem deslocação, fica a ordem da Api", () => {
    expect(rankStores([far, near], false).map((s) => s.id)).toEqual(["far", "near"]);
  });

  it("com deslocação, ganha o total com a ida à loja e as lojas fora do raio vão para o fim", () => {
    expect(rankStores([none, far, partial, near], true).map((s) => s.id)).toEqual(["near", "far", "none", "partial"]);
  });
});
