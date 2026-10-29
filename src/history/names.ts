// Nomes para os eventos que só trazem ids (DomiOS_DataModel_EventLog.md,
// adenda 2026-10-29 (b)): produto, item da despensa e item da lista.

import type { DomainEventLogEntryDto } from "../api/types";

export interface EventRefs {
  productId?: string;
  pantryItemId?: string;
  shoppingListItemId?: string;
}

const refKeys: [keyof EventRefs, string][] = [
  ["productId", "productid"],
  ["pantryItemId", "pantryitemid"],
  ["shoppingListItemId", "shoppinglistitemid"],
];

/** Os ids do payload que dão nome ao evento; a Api grava o JSON em camelCase ou PascalCase. */
export function eventRefs(payload: string): EventRefs {
  const refs: EventRefs = {};
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) return refs;
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const match = refKeys.find(([, lower]) => lower === key.toLowerCase());
      if (match && typeof value === "string") refs[match[0]] = value;
    }
  } catch {
    // payload inválido: sem nome
  }
  return refs;
}

export interface NameLookups {
  /** Nome do produto por `productId`. */
  productNames: ReadonlyMap<string, string>;
  /** `productId` por `pantryItemId`. */
  pantryProducts: ReadonlyMap<string, string>;
  /** Rótulo por `shoppingListItemId`. */
  itemLabels: ReadonlyMap<string, string>;
}

/** O nome do que o evento diz respeito, ou `null` se ainda não se sabe (ou o item já não existe). */
export function eventName(
  event: Pick<DomainEventLogEntryDto, "aggregateType">,
  refs: EventRefs,
  lookups: NameLookups,
): string | null {
  if (refs.productId) return lookups.productNames.get(refs.productId) ?? null;
  if (refs.pantryItemId) {
    const productId = lookups.pantryProducts.get(refs.pantryItemId);
    return (productId && lookups.productNames.get(productId)) || null;
  }
  if (event.aggregateType === "ShoppingList" && refs.shoppingListItemId) {
    return lookups.itemLabels.get(refs.shoppingListItemId) ?? null;
  }
  return null;
}
