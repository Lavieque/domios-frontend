import type { SetShoppingPlanRequest, StoreComparisonDto } from "../api/shopping";

/** Onde se vai comprar: a cadeia e, com a deslocação contada, a loja física mais perto dela. */
export interface StoreChoice {
  chainId: string;
  physicalStoreId: string | null;
}

/** A loja da lista, a exceção de cada item por comprar (null segue a lista) e a deslocação que a comparação deu. */
export interface StorePlan {
  list: StoreChoice;
  items: { itemId: string; choice: StoreChoice | null }[];
  travelCost: number | null;
}

const travelIncluded = (comparison: StoreComparisonDto) => comparison.travel?.status === "Included";

export function choiceForStore(comparison: StoreComparisonDto, storeId: string): StoreChoice | null {
  const store = comparison.stores.find((s) => s.storeId === storeId);
  if (!store) return null;
  return {
    chainId: store.chainId,
    physicalStoreId: travelIncluded(comparison) ? (store.nearestStore?.physicalStoreId ?? null) : null,
  };
}

/** Tudo numa loja: a lista fica nela e os itens por comprar perdem as exceções. */
export function planForStore(comparison: StoreComparisonDto, storeId: string, pendingItemIds: string[]): StorePlan | null {
  const list = choiceForStore(comparison, storeId);
  if (!list) return null;
  const travelCost = travelIncluded(comparison) ? (comparison.stores.find((s) => s.storeId === storeId)?.travelCost ?? null) : null;
  return { list, items: pendingItemIds.map((itemId) => ({ itemId, choice: null })), travelCost };
}

/** A divisão que o ecrã mostra: com a deslocação contada, a que a conta (se divide mesmo); senão a da Api sem ela. */
export function activeSplit(comparison: StoreComparisonDto) {
  const withTravel = comparison.splitWithTravel;
  return travelIncluded(comparison) && withTravel && withTravel.storeCount > 1 ? withTravel : comparison.split;
}

/**
 * Segue a divisão: a lista fica na loja com mais itens (no empate, a primeira pela ordem da Api) e
 * os itens das outras lojas ganham a exceção. Os itens sem preço ficam na loja da lista.
 */
export function planFromSplit(comparison: StoreComparisonDto, pendingItemIds: string[]): StorePlan | null {
  const split = activeSplit(comparison);
  const storeOf = new Map<string, string>();
  for (const line of split.items) for (const itemId of line.itemIds) storeOf.set(itemId, line.storeId);

  const counts = new Map<string, number>();
  for (const itemId of pendingItemIds) {
    const storeId = storeOf.get(itemId);
    if (storeId) counts.set(storeId, (counts.get(storeId) ?? 0) + 1);
  }
  let main: string | null = null;
  for (const store of comparison.stores) {
    const count = counts.get(store.storeId) ?? 0;
    if (count > 0 && (main === null || count > (counts.get(main) ?? 0))) main = store.storeId;
  }
  if (main === null) return null;

  const list = choiceForStore(comparison, main);
  if (!list) return null;
  const mainStore = main;
  const travelCost = !travelIncluded(comparison)
    ? null
    : split === comparison.splitWithTravel
      ? comparison.splitWithTravel.travelCost
      : (comparison.stores.find((s) => s.storeId === mainStore)?.travelCost ?? null);
  return {
    list,
    travelCost,
    items: pendingItemIds.map((itemId) => {
      const storeId = storeOf.get(itemId);
      return { itemId, choice: storeId && storeId !== main ? choiceForStore(comparison, storeId) : null };
    }),
  };
}

/** O corpo de `PUT .../plan`: só as linhas que vão para outra loja. */
export function toPlanRequest(plan: StorePlan): SetShoppingPlanRequest {
  return {
    list: plan.list,
    items: plan.items.flatMap(({ itemId, choice }) => (choice ? [{ itemId, chainId: choice.chainId, physicalStoreId: choice.physicalStoreId }] : [])),
    travelCost: plan.travelCost,
  };
}
