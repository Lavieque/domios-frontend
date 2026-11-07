// Catálogo de ementas prontas (DomiOS_API_Fase7.md, secção 1). Leitura
// anónima na Api, mas este frontend só a mostra com sessão.

import { authedRequest } from "../auth/sessionStore";
import { send } from "./http";
import type { MealType } from "./planning";
import type { DishType, MainProtein, PagedResult, RecipeStatus } from "./types";

export interface MealPlanTemplateSummaryDto {
  mealPlanTemplateId: string;
  ownerHouseholdId: string | null;
  name: string;
  description: string | null;
  durationDays: number;
  servingsBasis: number;
  tags: string[];
  status: RecipeStatus;
  entryCount: number;
}

export interface MealPlanTemplateEntryDto {
  mealPlanTemplateEntryId: string;
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  recipeTitle: string;
  recipeStatus: RecipeStatus;
  dishType: DishType | null;
  mainProtein: MainProtein | null;
  servings: number;
  notes: string | null;
  sortOrder: number;
  recipeImageUrl: string | null;
}

export interface MealPlanTemplateDto extends Omit<MealPlanTemplateSummaryDto, "entryCount"> {
  entries: MealPlanTemplateEntryDto[];
}

export function searchMealPlanTemplates(search: string, page = 1, pageSize = 20): Promise<PagedResult<MealPlanTemplateSummaryDto>> {
  return send<PagedResult<MealPlanTemplateSummaryDto>>("/meal-plan-templates", { params: { search, page, pageSize } });
}

/** Com sessão: uma ementa da casa ainda em rascunho só se lê como membro dessa casa. */
export function getMealPlanTemplate(mealPlanTemplateId: string): Promise<MealPlanTemplateDto> {
  return authedRequest<MealPlanTemplateDto>(`/meal-plan-templates/${mealPlanTemplateId}`);
}

export interface MealPlanTemplateEntryRequest {
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  /** `null` = as doses da ementa. */
  servings: number | null;
  notes: string | null;
  sortOrder: number;
}

/** As ementas da própria casa, rascunhos incluídos. */
export function listHouseholdMealPlanTemplates(householdId: string): Promise<PagedResult<MealPlanTemplateSummaryDto>> {
  return authedRequest<PagedResult<MealPlanTemplateSummaryDto>>(`/households/${householdId}/meal-plan-templates`, {
    params: { page: 1, pageSize: 100 },
  });
}

/** Cria uma ementa da casa (fica em rascunho, editável). */
export function createHouseholdMealPlanTemplate(
  householdId: string,
  request: {
    name: string;
    description: string | null;
    durationDays: number;
    servingsBasis: number;
    tags: string[];
    entries: MealPlanTemplateEntryRequest[];
  },
): Promise<MealPlanTemplateDto> {
  return authedRequest<MealPlanTemplateDto>(`/households/${householdId}/meal-plan-templates`, { method: "POST", body: request });
}

/** Substitui todas as refeições; só enquanto a ementa está em rascunho. */
export function replaceMealPlanTemplateEntries(
  mealPlanTemplateId: string,
  entries: MealPlanTemplateEntryRequest[],
): Promise<MealPlanTemplateDto> {
  return authedRequest<MealPlanTemplateDto>(`/meal-plan-templates/${mealPlanTemplateId}/entries`, {
    method: "PUT",
    body: { entries },
  });
}

/** Uma refeição da ementa como pedido: guarda as doses só quando diferem das da ementa. */
export function toEntryRequest(entry: MealPlanTemplateEntryDto, servingsBasis: number): MealPlanTemplateEntryRequest {
  return {
    dayIndex: entry.dayIndex,
    mealType: entry.mealType,
    recipeId: entry.recipeId,
    servings: entry.servings === servingsBasis ? null : entry.servings,
    notes: entry.notes,
    sortOrder: entry.sortOrder,
  };
}
