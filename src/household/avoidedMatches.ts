// O que mostrar numa receita sobre o que os membros evitam. Só aparecem os
// membros com alguma correspondência: sem nenhuma não se diz "sem problema",
// porque a lista é do membro e a receita pode ter o que ele ainda não marcou.

import type { AvoidedMatchDto, RecipeRestrictionsDto } from "../api/memberPreferences";

export interface MemberAvoidedSummary {
  memberId: string;
  name: string;
  /** Ingredientes obrigatórios que o membro evita ou limita. */
  required: AvoidedMatchDto[];
  /** Ingredientes opcionais: a receita faz-se sem eles. */
  optional: AvoidedMatchDto[];
}

export function summarizeAvoided(restrictions: RecipeRestrictionsDto): MemberAvoidedSummary[] {
  return restrictions.members
    .map((member) => ({
      memberId: member.memberId,
      name: member.name,
      required: member.avoided?.matches ?? [],
      optional: member.avoided?.optionalMatches ?? [],
    }))
    .filter((member) => member.required.length > 0 || member.optional.length > 0);
}

/** Dietas que a Api verifica (adenda 2026-11-09 de DomiOS_API_Fase4.md, D.1), pelo nome da restrição. */
export const dietLabels: Record<string, string> = {
  Vegetarian: "vegetariana",
  Pescatarian: "pescetariana",
  Vegan: "vegana",
};

const mainProteinLabels = ["carne", "peixe", "marisco", "vegetariana"];

export interface MemberDietConflict {
  memberId: string;
  name: string;
  diet: string;
  /** O que quebra a dieta: "Frango (Carne e Aves)", "proteína principal: carne". */
  reasons: string[];
}

/** Só as dietas em `Conflict`; `Unverifiable` e `NoKnownConflict` não avisam. */
export function summarizeDietConflicts(restrictions: RecipeRestrictionsDto): MemberDietConflict[] {
  return restrictions.members.flatMap((member) =>
    (member.restrictions ?? [])
      .filter((r) => r.restriction in dietLabels && r.result === 0)
      .map((r) => ({
        memberId: member.memberId,
        name: member.name,
        diet: dietLabels[r.restriction],
        reasons: [
          ...(r.conflictingMainProtein != null ? [`proteína principal: ${mainProteinLabels[r.conflictingMainProtein] ?? "outra"}`] : []),
          ...r.conflictingIngredients.map((i) => (i.source === "Name" ? i.name : `${i.name} (${i.allergen})`)),
        ],
      })),
  );
}
