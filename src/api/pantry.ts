// Despensa da casa (DomiOS_API_MVP.md secção 3, FIFO na adenda 2026-10-08 de
// DomiOS_API_Fase1.md). Enums como números. O item só traz o productId: o
// nome vem de GET /products/{id}.

import { authedRequest } from "../auth/sessionStore";
import type { IsoDate } from "../plan/dates";
import type { MeasurementUnit, MoneyDto, PagedResult } from "./types";

export const PantryLocation = {
  Pantry: 0,
  Fridge: 1,
  Freezer: 2,
  Cabinet: 3,
} as const;
export type PantryLocation = (typeof PantryLocation)[keyof typeof PantryLocation];

export const pantryLocationLabels: Record<PantryLocation, string> = {
  [PantryLocation.Pantry]: "Despensa",
  [PantryLocation.Fridge]: "Frigorífico",
  [PantryLocation.Freezer]: "Congelador",
  [PantryLocation.Cabinet]: "Armário",
};

export const pantryLocations: PantryLocation[] = [
  PantryLocation.Pantry,
  PantryLocation.Fridge,
  PantryLocation.Freezer,
  PantryLocation.Cabinet,
];

export const PantryState = {
  Sealed: 0,
  Open: 1,
  Frozen: 2,
  Consumed: 3,
  Discarded: 4,
} as const;
export type PantryState = (typeof PantryState)[keyof typeof PantryState];

export const pantryStateLabels: Record<PantryState, string> = {
  [PantryState.Sealed]: "Fechado",
  [PantryState.Open]: "Aberto",
  [PantryState.Frozen]: "Congelado",
  [PantryState.Consumed]: "Consumido",
  [PantryState.Discarded]: "Deitado fora",
};

/** Os nomes que a query string aceita (`state=`, `location=`). */
const stateNames: Record<PantryState, string> = {
  [PantryState.Sealed]: "Sealed",
  [PantryState.Open]: "Open",
  [PantryState.Frozen]: "Frozen",
  [PantryState.Consumed]: "Consumed",
  [PantryState.Discarded]: "Discarded",
};
const locationNames: Record<PantryLocation, string> = {
  [PantryLocation.Pantry]: "Pantry",
  [PantryLocation.Fridge]: "Fridge",
  [PantryLocation.Freezer]: "Freezer",
  [PantryLocation.Cabinet]: "Cabinet",
};

export const DiscardReason = {
  Expired: 0,
  Spoiled: 1,
  Mistake: 2,
  Other: 3,
} as const;
export type DiscardReason = (typeof DiscardReason)[keyof typeof DiscardReason];

export const discardReasonLabels: Record<DiscardReason, string> = {
  [DiscardReason.Expired]: "Passou da validade",
  [DiscardReason.Spoiled]: "Estragou-se",
  [DiscardReason.Mistake]: "Registado por engano",
  [DiscardReason.Other]: "Outro motivo",
};

export interface QuantityDto {
  amount: number;
  unit: MeasurementUnit;
}

export interface PantryItemDto {
  pantryItemId: string;
  householdId: string;
  productId: string;
  quantity: QuantityDto;
  location: PantryLocation;
  state: PantryState;
  purchasedAt: string;
  expiresAt: IsoDate | null;
  openedAt: string | null;
  purchasedPrice: MoneyDto | null;
  batch: string | null;
  confidence: number;
}

export interface ListPantryOptions {
  /**
   * fifo e expiry = só o que conta como stock (inclui expirados). fifo: abertos
   * primeiro, depois validade (a ordem de consumo). expiry: só a validade, a
   * mais curta primeiro.
   */
  sort?: "fifo" | "expiry" | "purchasedAt";
  state?: PantryState;
  location?: PantryLocation;
  expiringBefore?: IsoDate;
  page?: number;
  pageSize?: number;
}

export interface AddPantryItemRequest {
  productId: string;
  quantity: QuantityDto;
  location: PantryLocation;
  purchasedAt: string;
  expiresAt: IsoDate | null;
  purchasedPrice: MoneyDto | null;
}

const base = (householdId: string) => `/households/${householdId}/pantry-items`;

export function listPantryItems(householdId: string, options: ListPantryOptions = {}): Promise<PagedResult<PantryItemDto>> {
  return authedRequest<PagedResult<PantryItemDto>>(base(householdId), {
    params: {
      sort: options.sort,
      state: options.state === undefined ? undefined : stateNames[options.state],
      location: options.location === undefined ? undefined : locationNames[options.location],
      expiringBefore: options.expiringBefore,
      page: options.page,
      pageSize: options.pageSize,
    },
  });
}

export function addPantryItem(householdId: string, request: AddPantryItemRequest): Promise<PantryItemDto> {
  return authedRequest<PantryItemDto>(base(householdId), { method: "POST", body: request });
}

export function openPantryItem(householdId: string, pantryItemId: string): Promise<void> {
  return authedRequest<void>(`${base(householdId)}/${pantryItemId}/open`, { method: "POST" });
}

/** `amount` na unidade do item; sem `amount`, consome tudo. */
export function consumePantryItem(householdId: string, pantryItemId: string, amount?: number): Promise<void> {
  return authedRequest<void>(`${base(householdId)}/${pantryItemId}/consume`, {
    method: "POST",
    body: { amount: amount ?? null },
  });
}

export function discardPantryItem(householdId: string, pantryItemId: string, reason: DiscardReason): Promise<void> {
  return authedRequest<void>(`${base(householdId)}/${pantryItemId}/discard`, { method: "POST", body: { reason } });
}

export function movePantryItem(householdId: string, pantryItemId: string, location: PantryLocation): Promise<PantryItemDto> {
  return authedRequest<PantryItemDto>(`${base(householdId)}/${pantryItemId}`, {
    method: "PATCH",
    body: { location, quantity: null },
  });
}
