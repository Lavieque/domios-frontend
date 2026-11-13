// Despensa da casa (DomiOS_API_MVP.md secção 3, FIFO na adenda 2026-10-08 de
// DomiOS_API_Fase1.md). Enums como números. O item só traz o productId: o
// nome vem de GET /products/{id}.

import { authedRequest } from "../auth/sessionStore";
import type { IsoDate } from "../plan/dates";
import type { PaidPriceSource } from "./shopping";
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
  /** O que a casa leu na embalagem que comprou; independente do produto de qualquer cadeia. */
  scanned: ScannedProductDto | null;
  /** Sobras de uma refeição (adenda 2026-11-09 de DomiOS_API_Fase4.md, D.3). */
  sourceMealId?: string | null;
  /** Onde foi comprado e de onde vem o preço (adenda 2026-11-09 de DomiOS_API_Fase1.md). */
  purchasedChainId?: string | null;
  purchasedPhysicalStoreId?: string | null;
  purchasedPriceSource?: PaidPriceSource | null;
}

export interface ScannedProductDto {
  barcode: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
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
  /** Nome ou marca do artigo, sem acentos nem maiúsculas; procura em todos os itens, não só na página. */
  search?: string;
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
  /** Cadeia onde foi comprado; só cadeias `Active` (outra dá 404). */
  chainId?: string | null;
}

/** Um item do pedido em lote: um produto ou, sem produto, um ingrediente (entra pelo produto genérico dele). */
export interface AddPantryItemsBatchItem {
  productId: string | null;
  ingredientId: string | null;
  quantity: QuantityDto;
  location: PantryLocation;
  expiresAt: IsoDate | null;
  purchasedPrice: MoneyDto | null;
  chainId?: string | null;
}

const base = (householdId: string) => `/households/${householdId}/pantry-items`;

export function listPantryItems(householdId: string, options: ListPantryOptions = {}): Promise<PagedResult<PantryItemDto>> {
  return authedRequest<PagedResult<PantryItemDto>>(base(householdId), {
    params: {
      sort: options.sort,
      state: options.state === undefined ? undefined : stateNames[options.state],
      location: options.location === undefined ? undefined : locationNames[options.location],
      expiringBefore: options.expiringBefore,
      search: options.search,
      page: options.page,
      pageSize: options.pageSize,
    },
  });
}

export function addPantryItem(householdId: string, request: AddPantryItemRequest): Promise<PantryItemDto> {
  return authedRequest<PantryItemDto>(base(householdId), { method: "POST", body: request });
}

/** Todos ou nenhum. */
export function addPantryItemsBatch(householdId: string, items: AddPantryItemsBatchItem[]): Promise<PantryItemDto[]> {
  return authedRequest<PantryItemDto[]>(`${base(householdId)}/batch`, { method: "POST", body: { items } });
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

/** Guarda (ou, com campos vazios, apaga) a embalagem lida. A validade só muda se vier uma. */
export function scanPantryItem(
  householdId: string,
  pantryItemId: string,
  scanned: ScannedProductDto,
  expiresAt?: IsoDate,
): Promise<PantryItemDto> {
  return authedRequest<PantryItemDto>(`${base(householdId)}/${pantryItemId}`, {
    method: "PATCH",
    body: { location: null, quantity: null, scanned, expiresAt: expiresAt ?? null },
  });
}

// --- Sobras e desperdício (DomiOS_API_Fase4.md, adenda 2026-11-09, D.3 e D.5) ---

/** Come `servings` doses de um item de sobras: regista a refeição com a nutrição da de origem. */
export function eatLeftovers(householdId: string, pantryItemId: string, mealType: number, servings = 1): Promise<unknown> {
  return authedRequest<unknown>(`/households/${householdId}/meals/from-leftovers`, {
    method: "POST",
    body: { pantryItemId, mealType, servings, eatenAt: null, participantMemberIds: [], notes: null },
  });
}

export interface PantryWasteItemDto {
  pantryItemId: string;
  productId: string;
  productName: string;
  /** O que restava quando foi deitado fora. */
  quantity: QuantityDto;
  reason: DiscardReason | null;
  discardedAt: string;
  estimatedValue: MoneyDto | null;
}

/** `Mistake` fica fora das contas e do valor; aparece em `byReason` e `items`. */
export interface PantryWasteDto {
  from: string;
  to: string;
  discardedItemCount: number;
  consumedItemCount: number;
  /** null sem consumidos nem descartados. */
  wastePercent: number | null;
  estimatedValue: MoneyDto | null;
  valuedItemCount: number;
  byReason: { reason: DiscardReason | null; itemCount: number; estimatedValue: MoneyDto | null }[];
  byCategory: { categoryId: string | null; name: string; itemCount: number; estimatedValue: MoneyDto | null }[];
  items: PantryWasteItemDto[];
}

/** `from`/`to` yyyy-MM-dd no fuso da casa, ambos incluídos, até 366 dias. */
export function getPantryWaste(householdId: string, from: string, to: string): Promise<PantryWasteDto> {
  return authedRequest<PantryWasteDto>(`/households/${householdId}/pantry/waste`, { params: { from, to } });
}
