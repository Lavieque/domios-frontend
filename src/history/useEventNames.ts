import { useEffect, useMemo, useState } from "react";
import { listPantryItems } from "../api/pantry";
import { getShoppingList } from "../api/shopping";
import type { DomainEventLogEntryDto } from "../api/types";
import { useProducts } from "../pantry/useProducts";
import { eventName, eventRefs } from "./names";

const PANTRY_PAGE_SIZE = 100;
const PANTRY_MAX_PAGES = 5;

/**
 * Nome de cada evento da página que só traz ids, por `eventId`. Os eventos de
 * itens já tirados da lista ficam sem nome (a Api não os guarda); a despensa
 * guarda os itens consumidos e deitados fora. Um pedido que falhe só deixa
 * as linhas sem nome.
 */
export function useEventNames(householdId: string, events: DomainEventLogEntryDto[]): Map<string, string> {
  const refs = useMemo(() => new Map(events.map((e) => [e.eventId, eventRefs(e.payload)])), [events]);
  const [pantryProducts, setPantryProducts] = useState<Map<string, string>>(new Map());
  const [itemLabels, setItemLabels] = useState<Map<string, string>>(new Map());

  const pantryKey = [
    ...new Set([...refs.values()].filter((r) => !r.productId && r.pantryItemId).map((r) => r.pantryItemId as string)),
  ]
    .sort()
    .join(",");
  const listKey = [
    ...new Set(
      events
        .filter((e) => e.aggregateType === "ShoppingList" && refs.get(e.eventId)?.shoppingListItemId)
        .map((e) => e.aggregateId),
    ),
  ]
    .sort()
    .join(",");

  useEffect(() => {
    if (!pantryKey) return;
    let cancelled = false;
    const wanted = new Set(pantryKey.split(","));
    (async () => {
      const found = new Map<string, string>();
      for (let page = 1; page <= PANTRY_MAX_PAGES; page++) {
        const result = await listPantryItems(householdId, { page, pageSize: PANTRY_PAGE_SIZE });
        for (const item of result.items) if (wanted.has(item.pantryItemId)) found.set(item.pantryItemId, item.productId);
        if (found.size === wanted.size || page * PANTRY_PAGE_SIZE >= result.total) break;
      }
      if (!cancelled) setPantryProducts(found);
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [householdId, pantryKey]);

  useEffect(() => {
    if (!listKey) return;
    let cancelled = false;
    Promise.all(listKey.split(",").map((id) => getShoppingList(householdId, id).catch(() => null))).then((lists) => {
      if (cancelled) return;
      const labels = new Map<string, string>();
      for (const list of lists) for (const item of list?.items ?? []) labels.set(item.shoppingListItemId, item.label);
      setItemLabels(labels);
    });
    return () => {
      cancelled = true;
    };
  }, [householdId, listKey]);

  const products = useProducts([
    ...[...refs.values()].flatMap((r) => (r.productId ? [r.productId] : [])),
    ...pantryProducts.values(),
  ]);

  return useMemo(() => {
    const lookups = {
      productNames: new Map([...products].map(([id, product]) => [id, product.name])),
      pantryProducts,
      itemLabels,
    };
    const names = new Map<string, string>();
    for (const event of events) {
      const name = eventName(event, refs.get(event.eventId) ?? {}, lookups);
      if (name) names.set(event.eventId, name);
    }
    return names;
  }, [events, refs, products, pantryProducts, itemLabels]);
}
