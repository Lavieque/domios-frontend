// Objetivos nutricionais e alimentos a evitar de um membro (DomiOS_API_Fase4.md,
// adenda 2026-11-06, 5.1 e 5.2). Lê qualquer membro da casa; escreve o próprio
// membro ou um Admin (403 `forbidden-household-role`).

import { authedRequest } from "../auth/sessionStore";

/** Alvos por dia, em gramas (energia em kcal). `null` = sem alvo; `isSet` falso = nada definido. */
export interface MemberNutritionGoalsDto {
  memberId: string;
  isSet: boolean;
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  saturatesG: number | null;
  saltG: number | null;
  maxFatPerMealG: number | null;
  updatedAt: string | null;
}

export type SetNutritionGoalsRequest = Omit<MemberNutritionGoalsDto, "memberId" | "isSet" | "updatedAt">;

/** Esta API escreve este enum por extenso, ao contrário dos outros (que vão em número). */
export type AvoidSeverity = "Avoid" | "Limit";

export interface AvoidedIngredientDto {
  ingredientId: string;
  name: string;
  severity: AvoidSeverity;
  note: string | null;
}

export interface MemberAvoidedIngredientsDto {
  memberId: string;
  items: AvoidedIngredientDto[];
}

function memberPath(householdId: string, memberId: string): string {
  return `/households/${householdId}/members/${memberId}`;
}

export function getNutritionGoals(householdId: string, memberId: string): Promise<MemberNutritionGoalsDto> {
  return authedRequest<MemberNutritionGoalsDto>(`${memberPath(householdId, memberId)}/nutrition-goals`);
}

/** Substitui tudo: o que não vem deixa de ter alvo. Pelo menos um valor (senão 400 `invalid-argument`). */
export function setNutritionGoals(
  householdId: string,
  memberId: string,
  request: SetNutritionGoalsRequest,
): Promise<MemberNutritionGoalsDto> {
  return authedRequest<MemberNutritionGoalsDto>(`${memberPath(householdId, memberId)}/nutrition-goals`, {
    method: "PUT",
    body: request,
  });
}

export function clearNutritionGoals(householdId: string, memberId: string): Promise<void> {
  return authedRequest<void>(`${memberPath(householdId, memberId)}/nutrition-goals`, { method: "DELETE" });
}

export function getAvoidedIngredients(householdId: string, memberId: string): Promise<MemberAvoidedIngredientsDto> {
  return authedRequest<MemberAvoidedIngredientsDto>(`${memberPath(householdId, memberId)}/avoided-ingredients`);
}

/** Acrescenta ou muda o nível do ingrediente (não duplica). Máximo 200 por membro (400 `invariant-violation`). */
export function setAvoidedIngredient(
  householdId: string,
  memberId: string,
  ingredientId: string,
  severity: AvoidSeverity,
  note: string | null,
): Promise<AvoidedIngredientDto> {
  return authedRequest<AvoidedIngredientDto>(`${memberPath(householdId, memberId)}/avoided-ingredients/${ingredientId}`, {
    method: "PUT",
    body: { severity, note },
  });
}

export function removeAvoidedIngredient(householdId: string, memberId: string, ingredientId: string): Promise<void> {
  return authedRequest<void>(`${memberPath(householdId, memberId)}/avoided-ingredients/${ingredientId}`, {
    method: "DELETE",
  });
}
