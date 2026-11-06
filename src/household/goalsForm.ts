// Formulário dos objetivos nutricionais de um membro: texto de cada campo ↔
// pedido da Api. Os intervalos são os da Api (DomiOS_DataModel_Fase4.md, adenda
// 2026-11-06, A.1) e só protegem de erros de escrita: nada aqui recomenda um valor.

import type { MemberNutritionGoalsDto, SetNutritionGoalsRequest } from "../api/memberPreferences";

export type GoalKey = keyof SetNutritionGoalsRequest;

export interface GoalField {
  key: GoalKey;
  label: string;
  unit: string;
  min: number;
  max: number;
}

export const GOAL_FIELDS: GoalField[] = [
  { key: "energyKcal", label: "Energia", unit: "kcal por dia", min: 500, max: 10000 },
  { key: "proteinG", label: "Proteína", unit: "g por dia", min: 1, max: 2000 },
  { key: "carbsG", label: "Hidratos de carbono", unit: "g por dia", min: 1, max: 2000 },
  { key: "fatG", label: "Gordura", unit: "g por dia", min: 1, max: 2000 },
  { key: "fiberG", label: "Fibra", unit: "g por dia", min: 1, max: 2000 },
  { key: "sugarG", label: "Açúcares (máximo)", unit: "g por dia", min: 1, max: 2000 },
  { key: "saturatesG", label: "Saturados (máximo)", unit: "g por dia", min: 1, max: 2000 },
  { key: "saltG", label: "Sal (máximo)", unit: "g por dia", min: 0.1, max: 100 },
  { key: "maxFatPerMealG", label: "Gordura por refeição (máximo)", unit: "g por refeição", min: 1, max: 500 },
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
      return { ok: false, error: `${field.label}: escreve um número.` };
    }
    if (number < field.min || number > field.max) {
      return { ok: false, error: `${field.label}: tem de estar entre ${field.min} e ${field.max}.` };
    }

    request[field.key] = Math.round(number * 10) / 10;
    filled++;
  }

  if (filled === 0) {
    return { ok: false, error: "Preenche pelo menos um valor, ou apaga os objetivos." };
  }
  return { ok: true, request };
}
