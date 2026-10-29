import { describe, expect, it } from "vitest";
import { eventDetail, eventLabel, eventLink } from "./events";

describe("eventos do histórico", () => {
  it("usa o texto em português e cai no tipo quando não o conhece", () => {
    expect(eventLabel("PantryItemConsumed")).toBe("Consumido da despensa");
    expect(eventLabel("SomethingNew")).toBe("SomethingNew");
  });

  it("liga ao ecrã do agregado, exceto quando já não existe", () => {
    expect(eventLink({ aggregateType: "ShoppingList", aggregateId: "l1", eventType: "ShoppingListCreated" })).toBe(
      "/listas/l1",
    );
    expect(eventLink({ aggregateType: "PlannedMeal", aggregateId: "pm1", eventType: "PlannedMealRemoved" })).toBeNull();
    expect(eventLink({ aggregateType: "Meal", aggregateId: "m1", eventType: "MealLogged" })).toBeNull();
  });

  it("tira o nome do payload só quando ele o traz", () => {
    expect(eventDetail('{"shoppingListId":"l1","label":"Leite"}')).toBe("Leite");
    expect(eventDetail('{"Name":"Casa Silva"}')).toBe("Casa Silva");
    expect(eventDetail('{"pantryItemId":"p1"}')).toBeNull();
    expect(eventDetail("não é json")).toBeNull();
  });
});
