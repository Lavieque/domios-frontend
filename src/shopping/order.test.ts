import { describe, expect, it } from "vitest";
import { moveItem, withPendingOrder } from "./order";

describe("moveItem", () => {
  it("troca com o vizinho", () => {
    expect(moveItem(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });

  it("não sai dos extremos", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});

describe("withPendingOrder", () => {
  it("põe os por comprar pela ordem nova e deixa os comprados no lugar", () => {
    const items = [
      { shoppingListItemId: "leite", isPurchased: false },
      { shoppingListItemId: "pao", isPurchased: true },
      { shoppingListItemId: "ovos", isPurchased: false },
      { shoppingListItemId: "arroz", isPurchased: false },
    ];
    expect(withPendingOrder(items, ["arroz", "leite", "ovos"])).toEqual(["arroz", "pao", "leite", "ovos"]);
  });
});
