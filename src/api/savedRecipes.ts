// Receitas guardadas e "o que posso cozinhar" (DomiOS_API_Fase1.md, adenda 2026-11-07).
// Guardar não mexe no plano. Pôr uma receita na lista de compras também a guarda. Enums como números.

import { authedRequest } from "../auth/sessionStore";
import type { IsoDate } from "../plan/dates";
import type { IngredientReferenceDto } from "./planning";
import type { PagedResult } from "./types";

export const SavedRecipeOrigin = {
  Manual: 0,
  ShoppingList: 1,
} as const;
export type SavedRecipeOrigin = (typeof SavedRecipeOrigin)[keyof typeof SavedRecipeOrigin];

export const RecipeVerdict = {
  CanCook: 0,
  Uncertain: 1,
  Missing: 2,
} as const;
export type RecipeVerdict = (typeof RecipeVerdict)[keyof typeof RecipeVerdict];

export interface SavedRecipeDto {
  recipeId: string;
  title: string;
  imageUrl: string | null;
  servings: number;
  origin: SavedRecipeOrigin;
  savedByMemberId: string | null;
  savedAt: string;
}

export interface CookableRecipeDto {
  recipeId: string;
  title: string;
  imageUrl: string | null;
  servings: number;
  verdict: RecipeVerdict;
  requiredCount: number;
  availableCount: number;
  /** Obrigatórios que não chegam (em falta ou só em parte). */
  missingIngredients: IngredientReferenceDto[];
  expiringIngredients: (IngredientReferenceDto & { expiresAt: IsoDate })[];
  /** `null` = não está guardada (só vem do plano, ou é das "outras"). */
  savedOrigin: SavedRecipeOrigin | null;
  savedAt: string | null;
  plannedOn: IsoDate[];
}

export interface CookableRecipesDto {
  /** Guardadas e planeadas (de há uma semana a daqui a uma semana), as prontas primeiro. */
  saved: CookableRecipeDto[];
  /** Outras que a despensa cobre, ou a que falta no máximo um ingrediente. */
  others: CookableRecipeDto[];
}

function base(householdId: string): string {
  return `/households/${householdId}`;
}

export function listSavedRecipes(householdId: string): Promise<SavedRecipeDto[]> {
  return authedRequest<SavedRecipeDto[]>(`${base(householdId)}/saved-recipes`);
}

/** Idempotente. Máximo 500 por casa (409 `saved-recipes-limit`). */
export function saveRecipe(householdId: string, recipeId: string): Promise<SavedRecipeDto> {
  return authedRequest<SavedRecipeDto>(`${base(householdId)}/saved-recipes/${recipeId}`, { method: "PUT" });
}

export function removeSavedRecipe(householdId: string, recipeId: string): Promise<void> {
  return authedRequest<void>(`${base(householdId)}/saved-recipes/${recipeId}`, { method: "DELETE" });
}

/** `limit` só conta para as "outras" (1–50). */
export function getCookableRecipes(householdId: string, limit = 20): Promise<CookableRecipesDto> {
  return authedRequest<CookableRecipesDto>(`${base(householdId)}/recipes/cookable`, { params: { limit } });
}

/** Uma receita que a casa já cozinhou (refeições registadas a partir dela). */
export interface CookedRecipeDto {
  recipeId: string;
  /** Sem acesso à receita (`isReadable` falso): o título da última refeição. */
  title: string;
  imageUrl: string | null;
  timesCooked: number;
  lastCookedAt: string;
  isSaved: boolean;
  isReadable: boolean;
}

/** As mais recentes primeiro. */
export function listCookedRecipes(householdId: string, page = 1, pageSize = 20): Promise<PagedResult<CookedRecipeDto>> {
  return authedRequest<PagedResult<CookedRecipeDto>>(`${base(householdId)}/recipes/cooked`, { params: { page, pageSize } });
}
