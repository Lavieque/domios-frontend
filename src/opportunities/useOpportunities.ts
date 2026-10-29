import { useCallback, useEffect, useState } from "react";
import { listOpportunities, type OpportunityListDto } from "../api/opportunities";

// Cada leitura corre a geração na Api (o GoodPrice lê até 50 produtos), por
// isso lê-se uma vez por casa e por sessão de página. Fechar uma oportunidade
// tira-a da cópia guardada; um erro deixa a próxima chamada tentar outra vez.
const cache = new Map<string, Promise<OpportunityListDto | null>>();

function load(householdId: string): Promise<OpportunityListDto | null> {
  let pending = cache.get(householdId);
  if (!pending) {
    pending = listOpportunities(householdId).catch(() => {
      cache.delete(householdId);
      return null;
    });
    cache.set(householdId, pending);
  }
  return pending;
}

export interface OpportunitiesState {
  /** `null` enquanto carrega ou se falhar. */
  opportunities: OpportunityListDto | null;
  /**
   * Tira uma oportunidade já fechada (dispensada ou feita). Com `keepVisible`
   * só sai da cópia guardada: o ecrã continua a mostrá-la até se sair dele.
   */
  remove: (opportunityId: string, keepVisible?: boolean) => void;
}

export function useOpportunities(householdId: string): OpportunitiesState {
  const [opportunities, setOpportunities] = useState<OpportunityListDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOpportunities(null);
    load(householdId).then((loaded) => !cancelled && setOpportunities(loaded));
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  const remove = useCallback(
    (opportunityId: string, keepVisible = false) => {
      const update = (list: OpportunityListDto | null) =>
        list && { ...list, items: list.items.filter((o) => o.opportunityId !== opportunityId) };
      const pending = cache.get(householdId);
      if (pending) cache.set(householdId, pending.then(update));
      if (!keepVisible) setOpportunities(update);
    },
    [householdId],
  );

  return { opportunities, remove };
}
