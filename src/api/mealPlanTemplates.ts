// Catálogo de ementas prontas (DomiOS_API_Fase7.md, secção 1). Leitura
// anónima na Api, mas este frontend só a mostra com sessão.

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
}

export interface MealPlanTemplateDto extends Omit<MealPlanTemplateSummaryDto, "entryCount"> {
  entries: MealPlanTemplateEntryDto[];
}

export function searchMealPlanTemplates(search: string, page = 1, pageSize = 20): Promise<PagedResult<MealPlanTemplateSummaryDto>> {
  return send<PagedResult<MealPlanTemplateSummaryDto>>("/meal-plan-templates", { params: { search, page, pageSize } });
}

export function getMealPlanTemplate(mealPlanTemplateId: string): Promise<MealPlanTemplateDto> {
  return send<MealPlanTemplateDto>(`/meal-plan-templates/${mealPlanTemplateId}`);
}
