// Convites de membro da casa (DomiOS_API_Fase3.md, adenda 2026-11-23). O token vai sempre no corpo,
// nunca no URL: o link do email traz-o no fragmento (`/convite#token=...`).

import { authedRequest } from "../auth/sessionStore";
import { send } from "./http";

/** Convite pendente, como o Admin o vê. */
export interface MemberInviteDto {
  memberId: string;
  email: string;
  expiresAt: string;
}

/** O que a página do link mostra: a casa, o membro e o email convidado. */
export interface MemberInviteDetailsDto {
  householdId: string;
  householdName: string;
  memberId: string;
  memberName: string;
  email: string;
  expiresAt: string;
}

const membersPath = (householdId: string, memberId: string) => `/households/${householdId}/members/${memberId}/invites`;

/** Só Admin. Cancela o convite pendente do membro e envia um novo para `email`. */
export function inviteMember(householdId: string, memberId: string, email: string, language: string): Promise<MemberInviteDto> {
  return authedRequest<MemberInviteDto>(membersPath(householdId, memberId), { method: "POST", body: { email, language } });
}

/** Só Admin. Sem convite pendente também corre bem. */
export function revokeMemberInvite(householdId: string, memberId: string): Promise<void> {
  return authedRequest<void>(membersPath(householdId, memberId), { method: "DELETE" });
}

/** Só Admin: os convites por aceitar da casa. */
export function listMemberInvites(householdId: string): Promise<MemberInviteDto[]> {
  return authedRequest<MemberInviteDto[]>(`/households/${householdId}/member-invites`);
}

/** Anónima. 404 `invalid-invite` quando expirou, foi cancelado ou já usado. */
export function lookupMemberInvite(token: string): Promise<MemberInviteDetailsDto> {
  return send<MemberInviteDetailsDto>("/member-invites/lookup", { method: "POST", body: { token } });
}

/** Com sessão: liga a conta ao membro. 409 `invite-email-mismatch` com uma conta de outro email. */
export function acceptMemberInvite(token: string): Promise<{ householdId: string }> {
  return authedRequest<{ householdId: string }>("/member-invites/accept", { method: "POST", body: { token } });
}

/** Cria a conta com o convite: o email tem de ser o do convite; a conta entra logo na casa. */
export function registerWithMemberInvite(
  email: string,
  password: string,
  memberInviteToken: string,
  language: string,
): Promise<{ userId: string; householdId: string }> {
  return send<{ userId: string; householdId: string }>("/auth/register", {
    method: "POST",
    body: { email, password, memberInviteToken, language },
  });
}

// O token guarda-se na sessão do separador para sobreviver à ida a /entrar e voltar.
const STORAGE_KEY = "domios.memberInvite";

export function rememberInviteToken(token: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Sem armazenamento: o link do email continua a servir.
  }
}

export function rememberedInviteToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function forgetInviteToken() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada a fazer.
  }
}
