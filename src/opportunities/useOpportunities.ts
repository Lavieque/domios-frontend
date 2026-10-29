import { useCallback, useEffect, useState } from "react";
import { getOpportunitySummary, listOpportunities, type OpportunityListDto } from "../api/opportunities";

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

/** A frase da síntese; a falha só a esconde, as sugestões não dependem dela. */
function loadHeadline(householdId: string): Promise<string | null> {
  return getOpportunitySummary(householdId).then(
    (summary) => summary.headline,
    () => null,
  );
}

export interface OpportunitiesState {
  /** `null` enquanto carrega ou se falhar. */
  opportunities: OpportunityListDto | null;
  /** "3 ações podem poupar cerca de 18 €": conta também as que o orçamento reteve. */
  headline: string | null;
  /**
   * Tira uma oportunidade já fechada (dispensada ou feita). Com `keepVisible`
   * só sai da cópia guardada: o ecrã continua a mostrá-la até se sair dele.
   */
  remove: (opportunityId: string, keepVisible?: boolean) => void;
}

export function useOpportunities(householdId: string): OpportunitiesState {
  const [opportunities, setOpportunities] = useState<OpportunityListDto | null>(null);
  const [headline, setHeadline] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOpportunities(null);
    setHeadline(null);
    load(householdId).then((loaded) => {
      if (cancelled) return;
      setOpportunities(loaded);
      if (loaded) loadHeadline(householdId).then((text) => !cancelled && setHeadline(text));
    });
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
      // Fechar uma muda as contas da síntese.
      loadHeadline(householdId).then(setHeadline);
    },
    [householdId],
  );

  return { opportunities, headline, remove };
}
