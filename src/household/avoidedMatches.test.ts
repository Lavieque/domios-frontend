import { describe, expect, it } from "vitest";
import type { AvoidedMatchDto, RecipeRestrictionsDto } from "../api/memberPreferences";
import { summarizeAvoided } from "./avoidedMatches";

const tomato: AvoidedMatchDto = {
  ingredientId: "i1",
  name: "Tomate pelado",
  avoidedIngredient: "Tomate",
  severity: "Avoid",
  result: "Conflict",
  note: null,
};

describe("summarizeAvoided", () => {
  it("só devolve os membros com alguma correspondência", () => {
    const restrictions: RecipeRestrictionsDto = {
      members: [
        { memberId: "a", name: "Ana", avoided: { matches: [tomato], optionalMatches: [] } },
        { memberId: "b", name: "Rui", avoided: { matches: [], optionalMatches: [] } },
        { memberId: "c", name: "Eva", avoided: null },
        { memberId: "d", name: "Tiago", avoided: { matches: [], optionalMatches: [{ ...tomato, result: "Caution", severity: "Limit" }] } },
      ],
    };

    const summary = summarizeAvoided(restrictions);

    expect(summary.map((m) => m.name)).toEqual(["Ana", "Tiago"]);
    expect(summary[0].required).toHaveLength(1);
    expect(summary[1].optional).toHaveLength(1);
  });

  it("não devolve nada quando ninguém evita nada", () => {
    expect(summarizeAvoided({ members: [{ memberId: "a", name: "Ana", avoided: null }] })).toEqual([]);
  });
});
