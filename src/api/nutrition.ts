// Resumo e score nutricionais (DomiOS_API_Fase4.md, secção 5 e adendas de 2026-11-05 e 2026-11-06).
// Tudo é calculado na hora a partir das refeições registadas (ou do plano): a Api não guarda cópias.

import { authedRequest } from "../auth/sessionStore";
import type { IsoDate } from "../plan/dates";

export interface NutrientsDto {
  energyKcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  saturates: number;
  fiber: number;
  salt: number;
}

export type NutrientKey = keyof NutrientsDto;

/** % do objetivo diário do próprio membro; `null` nos nutrientes sem objetivo. */
export type GoalIntakePercentDto = { [K in NutrientKey]: number | null };

export interface NutritionDayDto {
  date: IsoDate;
  mealCount: number;
  nutrients: NutrientsDto;
  /** Só com `memberId`: % da dose de referência de um adulto (sem fibra). */
  referenceIntakePercent: Omit<NutrientsDto, "fiber"> | null;
  goalIntakePercent: GoalIntakePercentDto | null;
  /** Refeições do dia acima do máximo de gordura por refeição; `null` sem esse objetivo. */
  mealsOverFatLimit: number | null;
}

export interface NutritionSummaryDto {
  from: IsoDate;
  to: IsoDate;
  memberId: string | null;
  mealCount: number;
  coveredItemCount: number;
  uncoveredItemCount: number;
  total: NutrientsDto;
  days: NutritionDayDto[];
  /** O dia médio do período contra os objetivos por dia. */
  goalIntakePercent: GoalIntakePercentDto | null;
}

/** Esta Api escreve estes enums em número, como os outros. */
export const NutritionScoreSource = { Plan: 0, Meals: 1 } as const;
export type NutritionScoreSource = (typeof NutritionScoreSource)[keyof typeof NutritionScoreSource];

export const NutritionScoreComponent = { Balance: 0, Limits: 1, Fiber: 2, Variety: 3 } as const;
export type NutritionScoreComponent = (typeof NutritionScoreComponent)[keyof typeof NutritionScoreComponent];

export const NutritionScoreUnavailableReason = { NoData: 0, InsufficientCoverage: 1 } as const;
export type NutritionScoreUnavailableReason =
  (typeof NutritionScoreUnavailableReason)[keyof typeof NutritionScoreUnavailableReason];

export interface NutritionScoreComponentDto {
  component: NutritionScoreComponent;
  points: number;
  maxPoints: number;
  value: number;
}

export interface NutritionScoreDto {
  from: IsoDate;
  to: IsoDate;
  memberId: string | null;
  source: NutritionScoreSource | null;
  /** 0–100; `null` com `unavailableReason`. */
  score: number | null;
  unavailableReason: NutritionScoreUnavailableReason | null;
  coverage: number;
  components: NutritionScoreComponentDto[];
  /** Os limites e a fibra foram medidos contra os alvos do membro e não contra a dose de referência. */
  personalGoalsApplied: boolean;
}

/** A refeição como a lista devolve (`GET .../meals`); só o que o ecrã de nutrição usa. */
export interface MealSummaryDto {
  mealId: string;
  title: string;
  /** Número do `MealType`: Breakfast=0, Lunch=1, Dinner=2, Snack=3, Other=4. */
  mealType: number;
  eatenAt: string;
  servings: number;
  participantMemberIds: string[];
}

/** A parte de um participante numa refeição, pela sua porção (adenda 2026-11-09, D.2). */
export interface MemberMealNutritionDto {
  memberId: string;
  portion: number;
  nutrients: NutrientsDto;
}

/** `GET .../meals/{id}/nutrition`; `perMember` falta em Apis anteriores a 2026-11-09. */
export interface MealNutritionDto {
  mealId: string;
  total: NutrientsDto;
  perParticipant: NutrientsDto | null;
  coveredItemCount: number;
  uncoveredItemCount: number;
  perMember?: MemberMealNutritionDto[] | null;
}

function base(householdId: string): string {
  return `/households/${householdId}/nutrition`;
}

/** `memberId` vazio: a casa toda. Período de 92 dias no máximo, datas inclusivas. */
export function getNutritionSummary(
  householdId: string,
  from: IsoDate,
  to: IsoDate,
  memberId: string | null,
): Promise<NutritionSummaryDto> {
  return authedRequest<NutritionSummaryDto>(`${base(householdId)}/summary`, {
    params: { from, to, ...(memberId ? { memberId } : {}) },
  });
}

export function getNutritionScore(
  householdId: string,
  from: IsoDate,
  to: IsoDate,
  memberId: string | null,
): Promise<NutritionScoreDto> {
  return authedRequest<NutritionScoreDto>(`${base(householdId)}/score`, {
    params: { from, to, ...(memberId ? { memberId } : {}) },
  });
}

/** As refeições registadas entre duas datas (inclusivas), da mais recente para a mais antiga. */
export function listLoggedMeals(householdId: string, from: IsoDate, to: IsoDate, memberId: string | null) {
  return authedRequest<{ items: MealSummaryDto[]; total: number }>(`/households/${householdId}/meals`, {
    params: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z`, status: "Logged", pageSize: 100, ...(memberId ? { memberId } : {}) },
  });
}

export function getMealNutrition(householdId: string, mealId: string): Promise<MealNutritionDto> {
  return authedRequest<MealNutritionDto>(`/households/${householdId}/meals/${mealId}/nutrition`);
}
