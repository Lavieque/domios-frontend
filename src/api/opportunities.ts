// Oportunidades da casa (DomiOS_API_Fase8.md). A leitura normal corre a geração
// e o orçamento de atenção na Api; dismiss/act só mudam o estado.

import { authedRequest } from "../auth/sessionStore";
import type { OpportunityDto, OpportunityListDto, OpportunitySummaryDto } from "./opportunityTypes";

export * from "./opportunityTypes";

/** As oportunidades a mostrar agora; corre a geração na Api. */
export function listOpportunities(householdId: string): Promise<OpportunityListDto> {
  return authedRequest<OpportunityListDto>(`/households/${householdId}/opportunities`);
}

/** A síntese; `refresh=false` não volta a correr a geração (a lista acabou de a correr). */
export function getOpportunitySummary(householdId: string): Promise<OpportunitySummaryDto> {
  return authedRequest<OpportunitySummaryDto>(`/households/${householdId}/opportunities/summary`, {
    params: { refresh: false },
  });
}

export function dismissOpportunity(householdId: string, opportunityId: string): Promise<OpportunityDto> {
  return authedRequest<OpportunityDto>(`/households/${householdId}/opportunities/${opportunityId}/dismiss`, {
    method: "POST",
  });
}

/** A casa agiu; a ação em si faz-se pelas rotas próprias. */
export function actOnOpportunity(householdId: string, opportunityId: string): Promise<OpportunityDto> {
  return authedRequest<OpportunityDto>(`/households/${householdId}/opportunities/${opportunityId}/act`, {
    method: "POST",
  });
}
