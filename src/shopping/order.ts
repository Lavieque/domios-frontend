/**
 * Ordem à mão da lista de compras (DomiOS_API_Fase1.md, adenda 2026-10-29, opção A).
 * O ecrã só ordena os itens por comprar; a Api quer todos os itens da lista.
 */

/** Move o id na posição `index` um lugar para cima (-1) ou para baixo (+1). Nos extremos não muda nada. */
export function moveItem(ids: readonly string[], index: number, delta: -1 | 1): string[] {
  const target = index + delta;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return [...ids];
  const result = [...ids];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

/**
 * A ordem completa a enviar: os itens por comprar ocupam os lugares que já tinham, pela
 * ordem nova, e os comprados ficam onde estavam.
 */
export function withPendingOrder(
  items: readonly { shoppingListItemId: string; isPurchased: boolean }[],
  pendingIds: readonly string[],
): string[] {
  let next = 0;
  return items.map((item) => (item.isPurchased ? item.shoppingListItemId : pendingIds[next++]));
}
