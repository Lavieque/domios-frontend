// Plano de refeições da casa (DomiOS_API_Fase6.md, com a adenda das
// sugestões, e DomiOS_API_Fase7.md secções 2–3). Enums como números.

import { authedRequest } from "../auth/sessionStore";
import type { IsoDate } from "../plan/dates";
import type { MeasurementUnit } from "./types";

export const MealType = {
  Breakfast: 0,
  Lunch: 1,
  Dinner: 2,
  Snack: 3,
  Other: 4,
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];

export const mealTypeLabels: Record<MealType, string> = {
  [MealType.Breakfast]: "Pequeno-almoço",
  [MealType.Lunch]: "Almoço",
  [MealType.Dinner]: "Jantar",
  [MealType.Snack]: "Lanche",
  [MealType.Other]: "Outra",
};

/** Ordem do enum = ordem em que a Api devolve as refeições do dia. */
export const mealTypes: MealType[] = [MealType.Breakfast, MealType.Lunch, MealType.Dinner, MealType.Snack, MealType.Other];

export const PlannedMealStatus = {
  Planned: 0,
  Cooked: 1,
  Skipped: 2,
} as const;
export type PlannedMealStatus = (typeof PlannedMealStatus)[keyof typeof PlannedMealStatus];

export const plannedMealStatusLabels: Record<PlannedMealStatus, string> = {
  [PlannedMealStatus.Planned]: "Planeada",
  [PlannedMealStatus.Cooked]: "Cozinhada",
  [PlannedMealStatus.Skipped]: "Saltada",
};

export interface PlannedMealDto {
  plannedMealId: string;
  householdId: string;
  date: IsoDate;
  mealType: MealType;
  recipeId: string | null;
  title: string;
  servings: number;
  participantMemberIds: string[];
  notes: string | null;
  status: PlannedMealStatus;
  mealId: string | null;
}

export interface CreatePlannedMealRequest {
  date: IsoDate;
  mealType: MealType;
  recipeId?: string | null;
  title?: string | null;
  servings?: number | null;
}

const base = (householdId: string) => `/households/${householdId}/planned-meals`;

/** `from`/`to` inclusivos, no máximo 92 dias. */
export function listPlannedMeals(householdId: string, from: IsoDate, to: IsoDate): Promise<PlannedMealDto[]> {
  return authedRequest<PlannedMealDto[]>(base(householdId), { params: { from, to } });
}

export function createPlannedMeal(householdId: string, request: CreatePlannedMealRequest): Promise<PlannedMealDto> {
  return authedRequest<PlannedMealDto>(base(householdId), { method: "POST", body: request });
}

export function deletePlannedMeal(householdId: string, plannedMealId: string): Promise<void> {
  return authedRequest<void>(`${base(householdId)}/${plannedMealId}`, { method: "DELETE" });
}

export function skipPlannedMeal(householdId: string, plannedMealId: string): Promise<PlannedMealDto> {
  return authedRequest<PlannedMealDto>(`${base(householdId)}/${plannedMealId}/skip`, { method: "POST" });
}

export function unskipPlannedMeal(householdId: string, plannedMealId: string): Promise<PlannedMealDto> {
  return authedRequest<PlannedMealDto>(`${base(householdId)}/${plannedMealId}/unskip`, { method: "POST" });
}

// --- Sugestões (adenda 2026-10-15 da Fase 6) ---

export const RestrictionResult = {
  Conflict: 0,
  NoKnownConflict: 1,
  Unverifiable: 2,
} as const;
export type RestrictionResult = (typeof RestrictionResult)[keyof typeof RestrictionResult];

export const SuggestionReason = {
  UsesPantry: 0,
  UsesExpiringItems: 1,
  RecentlyCooked: 2,
  AlreadyPlanned: 3,
  RestrictionsUnverifiable: 4,
} as const;
export type SuggestionReason = (typeof SuggestionReason)[keyof typeof SuggestionReason];

export const suggestionReasonLabels: Record<SuggestionReason, string> = {
  [SuggestionReason.UsesPantry]: "Usa o que tens",
  [SuggestionReason.UsesExpiringItems]: "Aproveita o que está a expirar",
  [SuggestionReason.RecentlyCooked]: "Cozinhada há pouco",
  [SuggestionReason.AlreadyPlanned]: "Já está no plano",
  [SuggestionReason.RestrictionsUnverifiable]: "Restrições por confirmar",
};

export interface IngredientReferenceDto {
  ingredientId: string;
  name: string;
}

export interface MealSuggestionDto {
  recipeId: string;
  title: string;
  servings: number;
  score: number;
  ingredientCount: number;
  availableCount: number;
  partialCount: number;
  missingIngredients: IngredientReferenceDto[];
  expiringIngredients: (IngredientReferenceDto & { expiresAt: IsoDate })[];
  lastCookedAt: string | null;
  plannedOn: IsoDate[];
  restrictions: RestrictionResult;
  reasons: SuggestionReason[];
}

export interface MealSuggestionsDto {
  date: IsoDate;
  candidateCount: number;
  suggestions: MealSuggestionDto[];
}

export function getSuggestions(householdId: string, date: IsoDate, limit = 6): Promise<MealSuggestionsDto> {
  return authedRequest<MealSuggestionsDto>(`${base(householdId)}/suggestions`, { params: { date, limit } });
}

// --- Disponibilidade do plano (Fase 7, secção 3) ---

export const AvailabilityLineStatus = {
  Missing: 0,
  Partial: 1,
  Available: 2,
} as const;
export type AvailabilityLineStatus = (typeof AvailabilityLineStatus)[keyof typeof AvailabilityLineStatus];

export interface PlanAvailabilityLineDto {
  ingredientId: string;
  label: string;
  unit: MeasurementUnit;
  required: number;
  available: number;
  missing: number;
  status: AvailabilityLineStatus;
  /** Linha "q.b.": as quantidades não são para mostrar. */
  nominalQuantity: boolean;
  hasUncomparableStock: boolean;
}

export interface PlanAvailabilityDto {
  from: IsoDate;
  to: IsoDate;
  plannedMealCount: number;
  skippedPlannedMealIds: string[];
  /** Available = 0, Missing = 1. */
  verdict: 0 | 1;
  lines: PlanAvailabilityLineDto[];
}

export function getPlanAvailability(householdId: string, from: IsoDate, to: IsoDate): Promise<PlanAvailabilityDto> {
  return authedRequest<PlanAvailabilityDto>(`${base(householdId)}/availability`, { params: { from, to } });
}

// --- Aplicar uma ementa (Fase 7, secção 2) ---

export const ConflictPolicy = {
  Skip: 0,
  Replace: 1,
  Fail: 2,
} as const;
export type ConflictPolicy = (typeof ConflictPolicy)[keyof typeof ConflictPolicy];

export interface ApplyTemplateRequest {
  mealPlanTemplateId: string;
  startDate: IsoDate;
  conflictPolicy: ConflictPolicy;
  servings?: number | null;
  skipMealTypes?: MealType[];
}

export interface TemplateRestrictionWarningDto {
  recipeId: string;
  title: string;
  dates: IsoDate[];
  members: { memberId: string; name: string }[];
}

export interface ApplyTemplateResultDto {
  mealPlanTemplateId: string;
  from: IsoDate;
  to: IsoDate;
  createdCount: number;
  removedCount: number;
  plannedMeals: PlannedMealDto[];
  /** reason: Conflict = 0 (já havia refeição), Cooked = 1 (já cozinhada, não substituída). */
  skippedMeals: { date: IsoDate; mealType: MealType; reason: 0 | 1 }[];
  skippedEntries: { mealPlanTemplateEntryId: string; dayIndex: number; mealType: MealType; recipeId: string }[];
  restrictionWarnings: TemplateRestrictionWarningDto[];
}

export function applyTemplate(householdId: string, request: ApplyTemplateRequest): Promise<ApplyTemplateResultDto> {
  return authedRequest<ApplyTemplateResultDto>(`${base(householdId)}/from-template`, { method: "POST", body: request });
}
