import { describe, expect, it } from "vitest";
import type { RecipeRestrictionsDto } from "../api/memberPreferences";
import { summarizeDietConflicts } from "./avoidedMatches";

const restrictions: RecipeRestrictionsDto = {
  members: [
    {
      memberId: "m1",
      name: "Ana",
      avoided: null,
      restrictions: [
        {
          restriction: "Vegetarian",
          result: 0,
          conflictingIngredients: [
            { ingredientId: "i1", name: "Frango", allergen: "Carne e Aves", source: "Category" },
            { ingredientId: "i2", name: "Mel", allergen: "mel", source: "Name" },
          ],
          ingredientsWithoutAllergenData: [],
          conflictingMainProtein: 0,
        },
        { restriction: "LactoseFree", result: 0, conflictingIngredients: [], ingredientsWithoutAllergenData: [] },
      ],
    },
    {
      memberId: "m2",
      name: "Rui",
      avoided: null,
      restrictions: [{ restriction: "Vegan", result: 2, conflictingIngredients: [], ingredientsWithoutAllergenData: [] }],
    },
  ],
};

describe("conflitos de dieta", () => {
  it("só avisa as dietas em conflito, com a proteína e os ingredientes", () => {
    expect(summarizeDietConflicts(restrictions)).toEqual([
      { memberId: "m1", name: "Ana", diet: "vegetariana", reasons: ["proteína principal: carne", "Frango (Carne e Aves)", "Mel"] },
    ]);
  });
});
