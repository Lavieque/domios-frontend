import { useCallback } from "react";
import { useLoad } from "../useLoad";
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
  const list = useLoad([householdId], () => load(householdId));
  // A síntese só se pede depois de haver sugestões.
  const summary = useLoad(list.data ? [householdId] : null, () => loadHeadline(householdId));
  const { update, data: opportunities } = list;
  const { reload: reloadHeadline, data: headline } = summary;

  const remove = useCallback(
    (opportunityId: string, keepVisible = false) => {
      const drop = (current: OpportunityListDto | null) =>
        current && { ...current, items: current.items.filter((o) => o.opportunityId !== opportunityId) };
      const pending = cache.get(householdId);
      if (pending) cache.set(householdId, pending.then(drop));
      if (!keepVisible) update((current) => drop(current)!);
      // Fechar uma muda as contas da síntese.
      reloadHeadline();
    },
    [householdId, update, reloadHeadline],
  );

  return { opportunities, headline, remove };
}
