// Texto dos eventos do histórico (GET /events e GET /households/{id}/timeline).
// A Api devolve o evento tal como foi guardado; o texto vive aqui.

import type { DomainEventLogEntryDto } from "../api/types";

export const eventLabels: Record<string, string> = {
  ProductCreated: "Produto criado",
  ProductUpdated: "Produto atualizado",
  ProductDiscontinued: "Produto descontinuado",
  ProductSubstituted: "Substituído por outro produto",
  ProductIngredientLinked: "Ligado a um ingrediente",
  ProductIngredientUnlinked: "Desligado do ingrediente",

  HouseholdCreated: "Casa criada",
  MemberAdded: "Membro adicionado",
  MemberUpdated: "Membro alterado",
  MemberRemoved: "Membro removido",
  MemberLinkedToUser: "Membro ligado a uma conta",

  PantryItemAdded: "Entrou na despensa",
  PantryItemOpened: "Aberto",
  PantryItemConsumed: "Consumido da despensa",
  PantryItemQuantityChanged: "Quantidade corrigida na despensa",
  PantryItemDiscarded: "Deitado fora",

  MealLogged: "Refeição registada",
  MealUpdated: "Refeição alterada",
  MealVoided: "Refeição anulada",

  ShoppingListCreated: "Lista criada",
  ShoppingListItemAdded: "Item acrescentado à lista",
  ShoppingListItemUpdated: "Item da lista alterado",
  ShoppingListItemRemoved: "Item tirado da lista",
  ShoppingListItemPurchased: "Item comprado",
  ShoppingListItemUnpurchased: "Item desmarcado",
  ShoppingListCompleted: "Lista concluída",
  ShoppingListCancelled: "Lista cancelada",
  ShoppingListReopened: "Lista reaberta",

  PlannedMealCreated: "Refeição planeada",
  PlannedMealUpdated: "Refeição planeada alterada",
  PlannedMealRemoved: "Refeição tirada do plano",
  PlannedMealCooked: "Refeição planeada cozinhada",
  PlannedMealSkipped: "Refeição planeada saltada",
  PlannedMealUnskipped: "Refeição planeada reposta",

  RecipeCreated: "Receita criada",
  RecipeUpdated: "Receita alterada",
  RecipeIngredientAdded: "Ingrediente acrescentado à receita",
  RecipeIngredientRemoved: "Ingrediente tirado da receita",
  RecipeStepAdded: "Passo acrescentado à receita",
  RecipeStepRemoved: "Passo tirado da receita",
  RecipeSourceUrlSet: "Origem da receita definida",
  RecipePublished: "Receita publicada",
  RecipeArchived: "Receita arquivada",

  MealPlanTemplateCreated: "Ementa criada",
  MealPlanTemplateUpdated: "Ementa alterada",
  MealPlanTemplateEntriesReplaced: "Refeições da ementa alteradas",
  MealPlanTemplatePublished: "Ementa publicada",
  MealPlanTemplateArchived: "Ementa arquivada",

  OpportunityCreated: "Sugestão nova",
  OpportunityPresented: "Sugestão mostrada",
  OpportunityActed: "Sugestão feita",
  OpportunityDismissed: "Sugestão dispensada",
  OpportunityResolved: "Sugestão resolvida",
};

/**
 * Filtros do histórico da casa: rótulo → `aggregateType` (vazio = todos).
 * "Tudo" deixa de fora as sugestões (`excludeAggregateType`): um evento por
 * sugestão mostrada enche-o, e têm a sua área.
 */
export const timelineAreas: { label: string; aggregateType: string; excludeAggregateType?: string }[] = [
  { label: "Tudo", aggregateType: "", excludeAggregateType: "Opportunity" },
  { label: "Despensa", aggregateType: "PantryItem" },
  { label: "Refeições", aggregateType: "Meal" },
  { label: "Listas", aggregateType: "ShoppingList" },
  { label: "Plano", aggregateType: "PlannedMeal" },
  { label: "Receitas", aggregateType: "Recipe" },
  { label: "Ementas", aggregateType: "MealPlanTemplate" },
  { label: "Sugestões", aggregateType: "Opportunity" },
  { label: "Casa", aggregateType: "Household" },
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
