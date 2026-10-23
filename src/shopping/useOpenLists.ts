import { useCallback, useEffect, useState } from "react";
import { listShoppingLists, ShoppingListStatus, type ShoppingListSummaryDto } from "../api/shopping";

/** Listas abertas da casa, para escolher onde pôr itens. */
export function useOpenLists(householdId: string) {
  const [lists, setLists] = useState<ShoppingListSummaryDto[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listShoppingLists(householdId, ShoppingListStatus.Open)
      .then((result) => !cancelled && setLists(result.items))
      .catch(() => !cancelled && setLists([]));
    return () => {
      cancelled = true;
    };
  }, [householdId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { lists, reload };
}
