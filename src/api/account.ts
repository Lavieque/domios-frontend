// Rotas /auth que exigem Bearer (DomiOS_API_Fase3.md, adenda 2026-10-22).

import { authedRequest } from "../auth/sessionStore";

/** Termina todas as sessões do utilizador, incluindo a atual. */
export function logoutAll(): Promise<void> {
  return authedRequest<void>("/auth/logout-all", { method: "POST" });
}

/** Novo link de verificação; a Api responde igual se já estiver verificado ou acima do limite. */
export function requestEmailVerification(): Promise<void> {
  return authedRequest<void>("/auth/email/verification-requests", { method: "POST" });
}
