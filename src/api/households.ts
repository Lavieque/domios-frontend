// Rotas de casa (DomiOS_API_MVP.md secção 1, DomiOS_API_Fase3.md). Todas
// exigem sessão; /households/{id}/... exige também ser Member ligado.

import { authedRequest } from "../auth/sessionStore";
import type { DomainEventLogEntryDto, PagedResult } from "./types";

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
  /** Porção habitual: 0,25 a 3,00 (adenda 2026-11-09 de DomiOS_API_Fase4.md, D.2). */
  defaultPortion?: number;
}

export interface HouseholdDto {
  householdId: string;
  name: string;
  timeZone: string;
  currency: string;
  locale: string;
  members: MemberDto[];
  /** Valores efetivos, com os por omissão (adenda 2026-11-09 de DomiOS_API_Fase5.md, E.2). */
  travelCostPerKm?: number;
  maxStoreDistanceKm?: number;
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

/**
 * Histórico da casa, mais recente primeiro (DomiOS_DataModel_EventLog.md,
 * adenda 2026-10-15). `aggregateType` vazio = todos; `excludeAggregateType`
 * deixa um tipo de fora (adenda 2026-10-29 (b)).
 */
export function getHouseholdTimeline(
  householdId: string,
  aggregateType: string,
  excludeAggregateType: string | undefined,
  page: number,
  pageSize = 20,
): Promise<PagedResult<DomainEventLogEntryDto>> {
  return authedRequest<PagedResult<DomainEventLogEntryDto>>(`/households/${householdId}/timeline`, {
    params: { aggregateType, excludeAggregateType, page, pageSize },
  });
}

/** Cria a casa; quem a cria fica ligado ao membro Admin. */
export function createHousehold(request: CreateHouseholdRequest): Promise<HouseholdDto> {
  return authedRequest<HouseholdDto>("/households", { method: "POST", body: request });
}

export interface UpdateHouseholdRequest {
  name?: string;
  timeZone?: string;
  currency?: string;
  locale?: string;
  /** 0 a 2 €/km; `null` volta ao valor por omissão. */
  travelCostPerKm?: number | null;
  /** 1 a 50 km; `null` volta ao valor por omissão. */
  maxStoreDistanceKm?: number | null;
}

export interface AddMemberRequest {
  name: string;
  role: MemberRole;
  dateOfBirth: string | null;
  dietaryRestrictions: string[];
}

/** `role` só o Admin pode mandar (403 `forbidden-household-role`); nome e restrições, qualquer membro. */
export interface UpdateMemberRequest {
  name?: string;
  role?: MemberRole;
  dietaryRestrictions?: string[];
  /** 0,25 a 3,00, até 2 casas decimais. */
  defaultPortion?: number;
}

/** Só Admin. Devolve a casa atualizada. */
export function updateHousehold(householdId: string, request: UpdateHouseholdRequest): Promise<HouseholdDto> {
  return authedRequest<HouseholdDto>(`/households/${householdId}`, { method: "PATCH", body: request });
}

/** Só Admin. Devolve a casa com o membro novo. */
export function addMember(householdId: string, request: AddMemberRequest): Promise<HouseholdDto> {
  return authedRequest<HouseholdDto>(`/households/${householdId}/members`, { method: "POST", body: request });
}

export function updateMember(householdId: string, memberId: string, request: UpdateMemberRequest): Promise<HouseholdDto> {
  return authedRequest<HouseholdDto>(`/households/${householdId}/members/${memberId}`, {
    method: "PATCH",
    body: request,
  });
}

/** Admin remove qualquer membro; os outros só a si próprios (sair da casa). O último Admin não sai. */
export function removeMember(householdId: string, memberId: string): Promise<void> {
  return authedRequest<void>(`/households/${householdId}/members/${memberId}`, { method: "DELETE" });
}

/** Só Admin: liga o membro à conta com este email; dá-lhe acesso total à casa. */
export function linkMemberToUser(householdId: string, memberId: string, email: string): Promise<void> {
  return authedRequest<void>(`/households/${householdId}/members/${memberId}/link-user`, {
    method: "POST",
    body: { email },
  });
}
