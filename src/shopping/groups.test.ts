import { describe, expect, it } from "vitest";
import type { ShoppingListItemDto } from "../api/shopping";
import { CategoryScope, type CategoryDto, type ProductDto } from "../api/types";
import { groupByTopCategory } from "./groups";

const category = (categoryId: string, name: string, parentCategoryId: string | null = null): CategoryDto => ({
  categoryId,
  name,
  parentCategoryId,
  scope: CategoryScope.Unclassified,
});

const product = (productId: string, cat: CategoryDto) => ({ productId, category: cat }) as ProductDto;

const item = (id: string, productId: string | null = null): ShoppingListItemDto => ({
  shoppingListItemId: id,
  label: id,
  productId,
  ingredientId: null,
  sourceRecipeId: null,
  quantity: { amount: 1, unit: 0 },
  isPurchased: false,
  purchasedAt: null,
});

const iogurtes = category("c-iog", "Iogurtes");
const gregos = category("c-gre", "Gregos", "c-iog");
const arroz = category("c-arr", "Arroz");
const categories = new Map([iogurtes, gregos, arroz].map((c) => [c.categoryId, c]));
const products = new Map([
  ["p-grego", product("p-grego", gregos)],
  ["p-natural", product("p-natural", iogurtes)],
  ["p-arroz", product("p-arroz", arroz)],
]);

describe("grupos da lista de compras", () => {
  it("junta pela categoria de topo, por nome, e mantém a ordem da lista em cada grupo", () => {
    const groups = groupByTopCategory(
      [item("grego", "p-grego"), item("arroz", "p-arroz"), item("natural", "p-natural")],
      products,
      categories,
    );
    expect(groups.map((g) => [g.name, g.items.map((i) => i.shoppingListItemId)])).toEqual([
      ["Arroz", ["arroz"]],
      ["Iogurtes", ["grego", "natural"]],
    ]);
  });

  it("põe em Outros, no fim, os itens sem produto e os de produto desconhecido", () => {
    const groups = groupByTopCategory(
      [item("sal"), item("perdido", "p-nenhum"), item("arroz", "p-arroz")],
      products,
      categories,
    );
    expect(groups.map((g) => [g.name, g.items.map((i) => i.shoppingListItemId)])).toEqual([
      ["Arroz", ["arroz"]],
      ["Outros", ["sal", "perdido"]],
    ]);
  });
});
