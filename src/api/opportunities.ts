// Oportunidades da casa (DomiOS_API_Fase8.md). A leitura normal corre a geração
// e o orçamento de atenção na Api; dismiss/act só mudam o estado.

import { authedRequest } from "../auth/sessionStore";
import type { OpportunityDto, OpportunityListDto } from "./opportunityTypes";

export * from "./opportunityTypes";

/** As oportunidades a mostrar agora; corre a geração na Api. */
export function listOpportunities(householdId: string): Promise<OpportunityListDto> {
  return authedRequest<OpportunityListDto>(`/households/${householdId}/opportunities`);
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
