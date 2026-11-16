// Texto dos eventos do histórico (GET /events e GET /households/{id}/timeline).
// A Api devolve o evento tal como foi guardado; o texto vive aqui.

import type { DomainEventLogEntryDto } from "../api/types";
import { localized, type Dict } from "../i18n";

export const eventLabels: Record<string, string> = localized((t) => t.enums.events);

/**
 * Filtros do histórico da casa: `aggregateType` (vazio = todos); o rótulo está
 * em `t.enums.timelineAreas`, pela chave `area`.
 * "Tudo" deixa de fora as sugestões (`excludeAggregateType`): um evento por
 * sugestão mostrada enche-o, e têm a sua área.
 */
export const timelineAreas: { area: keyof Dict["enums"]["timelineAreas"]; aggregateType: string; excludeAggregateType?: string }[] = [
  { area: "all", aggregateType: "", excludeAggregateType: "Opportunity" },
  { area: "PantryItem", aggregateType: "PantryItem" },
  { area: "Meal", aggregateType: "Meal" },
  { area: "ShoppingList", aggregateType: "ShoppingList" },
  { area: "PlannedMeal", aggregateType: "PlannedMeal" },
  { area: "Recipe", aggregateType: "Recipe" },
  { area: "MealPlanTemplate", aggregateType: "MealPlanTemplate" },
  { area: "Opportunity", aggregateType: "Opportunity" },
  { area: "Household", aggregateType: "Household" },
];

export function eventLabel(eventType: string): string {
  return eventLabels[eventType] ?? eventType;
}

/** Ecrã do agregado, quando existe um. */
export function eventLink(event: Pick<DomainEventLogEntryDto, "aggregateType" | "aggregateId" | "eventType">): string | null {
  switch (event.aggregateType) {
    case "ShoppingList":
      return `/listas/${event.aggregateId}`;
    case "Recipe":
      return `/receitas/${event.aggregateId}`;
    case "MealPlanTemplate":
      return `/ementas/${event.aggregateId}`;
    case "PlannedMeal":
      return event.eventType === "PlannedMealRemoved" ? null : "/plano";
    case "PantryItem":
      return "/despensa";
    case "Household":
      return "/casa";
    default:
      return null;
  }
}

/** Nome que o próprio evento traz (`label`, `name` ou `title`), se trouxer. */
export function eventDetail(payload: string): string | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) return null;
    const fields = parsed as Record<string, unknown>;
    for (const key of ["label", "name", "title", "Label", "Name", "Title"]) {
      const value = fields[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  } catch {
    // payload inválido: mostra-se só o tipo
  }
  return null;
}
