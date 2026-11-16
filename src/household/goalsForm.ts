// Formulário dos objetivos nutricionais de um membro: texto de cada campo ↔
// pedido da Api. Os intervalos são os da Api (DomiOS_DataModel_Fase4.md, adenda
// 2026-11-06, A.1) e só protegem de erros de escrita: nada aqui recomenda um valor.

import type { MemberNutritionGoalsDto, SetNutritionGoalsRequest } from "../api/memberPreferences";
import { tr } from "../i18n";

export type GoalKey = keyof SetNutritionGoalsRequest;

export interface GoalField {
  key: GoalKey;
  label: string;
  unit: string;
  min: number;
  max: number;
}

/** O rótulo e a unidade leem-se na língua atual sempre que são pedidos. */
function goalField(key: GoalKey, unit: string, per: "day" | "meal", min: number, max: number): GoalField {
  return {
    key,
    min,
    max,
    get label() {
      return tr().ui.goals[key];
    },
    get unit() {
      const goals = tr().ui.goals;
      return per === "day" ? goals.perDay(unit) : goals.perMeal(unit);
    },
  };
}

export const GOAL_FIELDS: GoalField[] = [
  goalField("energyKcal", "kcal", "day", 500, 10000),
  goalField("proteinG", "g", "day", 1, 2000),
  goalField("carbsG", "g", "day", 1, 2000),
  goalField("fatG", "g", "day", 1, 2000),
  goalField("fiberG", "g", "day", 1, 2000),
  goalField("sugarG", "g", "day", 1, 2000),
  goalField("saturatesG", "g", "day", 1, 2000),
  goalField("saltG", "g", "day", 0.1, 100),
  goalField("maxFatPerMealG", "g", "meal", 1, 500),
];

export type GoalValues = Record<GoalKey, string>;

export function goalValuesFrom(goals: MemberNutritionGoalsDto | null): GoalValues {
  const values = {} as GoalValues;
  for (const field of GOAL_FIELDS) {
    const value = goals?.[field.key];
    values[field.key] = value === null || value === undefined ? "" : String(value).replace(".", ",");
  }
  return values;
}

export type ParsedGoals = { ok: true; request: SetNutritionGoalsRequest } | { ok: false; error: string };

/** Aceita vírgula ou ponto decimal; vazio = sem alvo; pelo menos um valor. */
export function parseGoalValues(values: GoalValues): ParsedGoals {
  const request = {} as SetNutritionGoalsRequest;
  let filled = 0;

  for (const field of GOAL_FIELDS) {
    const text = values[field.key].trim().replace(",", ".");
    if (text === "") {
      request[field.key] = null;
      continue;
    }

    const number = Number(text);
    if (!Number.isFinite(number)) {
      return { ok: false, error: tr().ui.goals.notANumber(field.label) };
    }
    if (number < field.min || number > field.max) {
      return { ok: false, error: tr().ui.goals.outOfRange(field.label, field.min, field.max) };
    }

    request[field.key] = Math.round(number * 10) / 10;
    filled++;
  }

  if (filled === 0) {
    return { ok: false, error: tr().ui.goals.fillOne };
  }
  return { ok: true, request };
}
