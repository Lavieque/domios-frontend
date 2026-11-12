// Ordem das lojas na comparação de uma lista (DomiOS_API_Fase5.md, adenda 2026-11-09, E.4).

/**
 * Sem deslocação, a ordem da Api (mais itens com preço, depois o total). Com ela: mais itens, depois as
 * lojas com loja física no raio (as outras não têm como lá ir), depois o total com a deslocação.
 */
export function rankStores<T extends { coveredItemCount: number; total: number; totalWithTravel?: number | null }>(
  stores: T[],
  withTravel: boolean,
): T[] {
  if (!withTravel) return stores;
  const reachable = (s: T) => (s.totalWithTravel != null ? 0 : 1);
  return [...stores].sort(
    (a, b) =>
      b.coveredItemCount - a.coveredItemCount ||
      reachable(a) - reachable(b) ||
      (a.totalWithTravel ?? a.total) - (b.totalWithTravel ?? b.total),
  );
}
