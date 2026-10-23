// Rotas de casa (DomiOS_API_MVP.md secção 1, DomiOS_API_Fase3.md). Todas
// exigem sessão; /households/{id}/... exige também ser Member ligado.

import { authedRequest } from "../auth/sessionStore";

export const MemberRole = {
  Admin: 0,
  Adult: 1,
  Child: 2,
  Guest: 3,
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const memberRoleLabels: Record<MemberRole, string> = {
  [MemberRole.Admin]: "Administrador",
  [MemberRole.Adult]: "Adulto",
  [MemberRole.Child]: "Criança",
  [MemberRole.Guest]: "Convidado",
};

/** Uma casa vista pelo utilizador: que membro é lá e com que papel. */
export interface CallerHouseholdDto {
  householdId: string;
  name: string;
  memberId: string;
  role: MemberRole;
}

export interface MemberDto {
  memberId: string;
  name: string;
  role: MemberRole;
  dateOfBirth: string | null;
  dietaryRestrictions: string[];
  userId: string | null;
}

export interface HouseholdDto {
  householdId: string;
  name: string;
  timeZone: string;
  currency: string;
  locale: string;
  members: MemberDto[];
}

export interface CreateHouseholdRequest {
  name: string;
  timeZone: string;
  currency: string;
  adminMemberName: string;
}

/** As casas de que o utilizador é membro ligado, por nome (adenda 2026-10-23). */
export function listMyHouseholds(): Promise<CallerHouseholdDto[]> {
  return authedRequest<CallerHouseholdDto[]>("/households");
}

export function getHousehold(householdId: string): Promise<HouseholdDto> {
  return authedRequest<HouseholdDto>(`/households/${householdId}`);
}

/** Cria a casa; quem a cria fica ligado ao membro Admin. */
export function createHousehold(request: CreateHouseholdRequest): Promise<HouseholdDto> {
  return authedRequest<HouseholdDto>("/households", { method: "POST", body: request });
}
