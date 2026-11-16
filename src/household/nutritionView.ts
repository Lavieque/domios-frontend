// O que o ecrã de nutrição mostra de cada objetivo: o dia médio do período contra o alvo do membro.
// Os valores vêm da Api (nada aqui avalia se um alvo é bom ou mau); só se juntam, em linhas, o
// consumo médio, o alvo e a percentagem que a Api já calculou.

import type { MemberNutritionGoalsDto } from "../api/memberPreferences";
import type { NutrientKey, NutritionSummaryDto } from "../api/nutrition";
import { tr } from "../i18n";

interface NutrientInfo {
  key: NutrientKey;
  label: string;
  unit: string;
  goal: keyof MemberNutritionGoalsDto;
  /** Máximo (açúcares, saturados, sal): passar de 100 % é passar do alvo. Nos outros, 100 % é chegar lá. */
  isMax: boolean;
}

/** O rótulo lê-se na língua atual sempre que é pedido. */
function nutrient(info: Omit<NutrientInfo, "label">): NutrientInfo {
  return {
    ...info,
    get label() {
      return tr().ui.nutrients[info.key];
    },
  };
}

export const NUTRIENTS: NutrientInfo[] = [
  nutrient({ key: "energyKcal", unit: "kcal", goal: "energyKcal", isMax: false }),
  nutrient({ key: "protein", unit: "g", goal: "proteinG", isMax: false }),
  nutrient({ key: "carbs", unit: "g", goal: "carbsG", isMax: false }),
  nutrient({ key: "fat", unit: "g", goal: "fatG", isMax: false }),
  nutrient({ key: "fiber", unit: "g", goal: "fiberG", isMax: false }),
  nutrient({ key: "sugar", unit: "g", goal: "sugarG", isMax: true }),
  nutrient({ key: "saturates", unit: "g", goal: "saturatesG", isMax: true }),
  nutrient({ key: "salt", unit: "g", goal: "saltG", isMax: true }),
];

export interface GoalRow {
  key: NutrientKey;
  label: string;
  unit: string;
  isMax: boolean;
  /** Média por dia do período. */
  perDay: number;
  target: number;
  /** % do alvo, como a Api a calculou. */
  percent: number;
  /** Só nos máximos: passou do alvo. */
  overTarget: boolean;
}

/** Uma linha por nutriente com alvo definido; sem alvos, lista vazia. */
export function goalRows(summary: NutritionSummaryDto, goals: MemberNutritionGoalsDto | null): GoalRow[] {
  const percents = summary.goalIntakePercent;
  if (!goals?.isSet || !percents || summary.days.length === 0) return [];

  const rows: GoalRow[] = [];
  for (const nutrient of NUTRIENTS) {
    const target = goals[nutrient.goal];
    const percent = percents[nutrient.key];
    if (typeof target !== "number" || percent === null) continue;
    rows.push({
      key: nutrient.key,
      label: nutrient.label,
      unit: nutrient.unit,
      isMax: nutrient.isMax,
      perDay: summary.total[nutrient.key] / summary.days.length,
      target,
      percent,
      overTarget: nutrient.isMax && percent > 100,
    });
  }
  return rows;
}

/** Refeições do período acima do máximo de gordura por refeição; `null` sem esse objetivo. */
export function mealsOverFatLimit(summary: NutritionSummaryDto): number | null {
  if (summary.days.every((day) => day.mealsOverFatLimit === null)) return null;
  return summary.days.reduce((sum, day) => sum + (day.mealsOverFatLimit ?? 0), 0);
}
