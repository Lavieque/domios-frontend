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
