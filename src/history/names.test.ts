import { describe, expect, it } from "vitest";
import { eventName, eventRefs, type NameLookups } from "./names";

const lookups: NameLookups = {
  productNames: new Map([["pr1", "Leite"]]),
  pantryProducts: new Map([["pi1", "pr1"]]),
  itemLabels: new Map([["it1", "Pão"]]),
};

describe("nomes dos eventos", () => {
  it("lê os ids do payload em camelCase ou PascalCase", () => {
    expect(eventRefs('{"PantryItemId":"pi1","ProductId":"pr1"}')).toEqual({ pantryItemId: "pi1", productId: "pr1" });
    expect(eventRefs('{"shoppingListId":"l1","shoppingListItemId":"it1"}')).toEqual({ shoppingListItemId: "it1" });
    expect(eventRefs("não é json")).toEqual({});
  });

  it("dá o nome do produto, do item da despensa ou do item da lista", () => {
    expect(eventName({ aggregateType: "PantryItem" }, { productId: "pr1" }, lookups)).toBe("Leite");
    expect(eventName({ aggregateType: "PantryItem" }, { pantryItemId: "pi1" }, lookups)).toBe("Leite");
    expect(eventName({ aggregateType: "ShoppingList" }, { shoppingListItemId: "it1" }, lookups)).toBe("Pão");
  });

  it("não inventa nome quando o item já não existe", () => {
    expect(eventName({ aggregateType: "ShoppingList" }, { shoppingListItemId: "gone" }, lookups)).toBeNull();
    expect(eventName({ aggregateType: "PantryItem" }, { pantryItemId: "gone" }, lookups)).toBeNull();
    expect(eventName({ aggregateType: "Meal" }, {}, lookups)).toBeNull();
  });
});
