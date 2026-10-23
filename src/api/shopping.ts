// Listas de compras da casa (DomiOS_API_Fase1.md secção 3 e adendas
// 2026-10-08/2026-10-22), lista do plano (DomiOS_API_Fase6.md secção 2) e
// comparação entre lojas (DomiOS_API_Fase5.md). Enums como números.

import { authedRequest } from "../auth/sessionStore";
import type { IsoDate } from "../plan/dates";
import type { QuantityDto } from "./pantry";
import type { PagedResult } from "./types";

export const ShoppingListStatus = {
  Open: 0,
  Completed: 1,
  Cancelled: 2,
} as const;
export type ShoppingListStatus = (typeof ShoppingListStatus)[keyof typeof ShoppingListStatus];

export const shoppingListStatusLabels: Record<ShoppingListStatus, string> = {
  [ShoppingListStatus.Open]: "Aberta",
  [ShoppingListStatus.Completed]: "Concluída",
  [ShoppingListStatus.Cancelled]: "Cancelada",
};

const statusNames: Record<ShoppingListStatus, string> = {
  [ShoppingListStatus.Open]: "Open",
  [ShoppingListStatus.Completed]: "Completed",
  [ShoppingListStatus.Cancelled]: "Cancelled",
};

export interface ShoppingListSummaryDto {
  shoppingListId: string;
  name: string;
  status: ShoppingListStatus;
  itemCount: number;
  purchasedItemCount: number;
}

export interface ShoppingListItemDto {
  shoppingListItemId: string;
  label: string;
  productId: string | null;
  ingredientId: string | null;
  sourceRecipeId: string | null;
  quantity: QuantityDto;
  isPurchased: boolean;
  purchasedAt: string | null;
}

export interface ShoppingListDto {
  shoppingListId: string;
  householdId: string;
  name: string;
  status: ShoppingListStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** Por ordem de criação. */
  items: ShoppingListItemDto[];
}

export interface AddItemRequest {
  label: string;
  quantity: QuantityDto;
  productId?: string | null;
  ingredientId?: string | null;
}

const base = (householdId: string) => `/households/${householdId}/shopping-lists`;
const listPath = (householdId: string, listId: string) => `${base(householdId)}/${listId}`;

export function listShoppingLists(
  householdId: string,
  status?: ShoppingListStatus,
  page = 1,
  pageSize = 50,
): Promise<PagedResult<ShoppingListSummaryDto>> {
  return authedRequest<PagedResult<ShoppingListSummaryDto>>(base(householdId), {
    params: { status: status === undefined ? undefined : statusNames[status], page, pageSize },
  });
}

/** Sem nome, a Api gera um. */
export function createShoppingList(householdId: string, name: string | null): Promise<ShoppingListDto> {
  return authedRequest<ShoppingListDto>(base(householdId), { method: "POST", body: { name } });
}

export function getShoppingList(householdId: string, listId: string): Promise<ShoppingListDto> {
  return authedRequest<ShoppingListDto>(listPath(householdId, listId));
}

export function renameShoppingList(householdId: string, listId: string, name: string): Promise<ShoppingListDto> {
  return authedRequest<ShoppingListDto>(listPath(householdId, listId), { method: "PATCH", body: { name } });
}

export function addShoppingListItem(householdId: string, listId: string, request: AddItemRequest): Promise<ShoppingListDto> {
  return authedRequest<ShoppingListDto>(`${listPath(householdId, listId)}/items`, { method: "POST", body: request });
}

/** `onlyMissing`: só o que a despensa não cobre. */
export function addItemsFromRecipe(
  householdId: string,
  listId: string,
  recipeId: string,
  onlyMissing: boolean,
  servings?: number,
): Promise<ShoppingListDto> {
  return authedRequest<ShoppingListDto>(`${listPath(householdId, listId)}/items/from-recipe`, {
    method: "POST",
    body: { recipeId, servings: servings ?? null, onlyMissing },
  });
}

export function deleteShoppingListItem(householdId: string, listId: string, itemId: string): Promise<void> {
  return authedRequest<void>(`${listPath(householdId, listId)}/items/${itemId}`, { method: "DELETE" });
}

export function setItemPurchased(householdId: string, listId: string, itemId: string, purchased: boolean): Promise<void> {
  return authedRequest<void>(`${listPath(householdId, listId)}/items/${itemId}/${purchased ? "purchase" : "unpurchase"}`, {
    method: "POST",
  });
}

export function completeShoppingList(householdId: string, listId: string): Promise<void> {
  return authedRequest<void>(`${listPath(householdId, listId)}/complete`, { method: "POST" });
}

export function cancelShoppingList(householdId: string, listId: string): Promise<void> {
  return authedRequest<void>(`${listPath(householdId, listId)}/cancel`, { method: "POST" });
}

export function reopenShoppingList(householdId: string, listId: string): Promise<void> {
  return authedRequest<void>(`${listPath(householdId, listId)}/reopen`, { method: "POST" });
}

// --- Lista do plano (Fase 6, secção 2) ---

export interface PlanShoppingListResultDto {
  shoppingList: ShoppingListDto;
  plannedMealCount: number;
  addedItemCount: number;
  skippedPlannedMealIds: string[];
}

export function addPlanToShoppingList(
  householdId: string,
  listId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<PlanShoppingListResultDto> {
  return authedRequest<PlanShoppingListResultDto>(`/households/${householdId}/planned-meals/shopping-list`, {
    method: "POST",
    body: { from, to, shoppingListId: listId, onlyMissing: true, includeOptional: false },
  });
}

// --- Comparação entre lojas (Fase 5) ---

export const UnpricedItemReason = {
  NoProduct: 0,
  NotSoldAnywhere: 1,
} as const;
export type UnpricedItemReason = (typeof UnpricedItemReason)[keyof typeof UnpricedItemReason];

export interface StoreComparisonItemDto {
  itemId: string;
  label: string;
  productId: string;
  productName: string;
  packageCount: number;
  quantityComparable: boolean;
  packagePrice: number;
  lineTotal: number;
  cardProductId: string;
  cardLineTotal: number;
  observedAt: string;
}

export interface StoreComparisonStoreDto {
  storeId: string;
  storeName: string;
  chainId: string;
  chainName: string;
  coveredItemCount: number;
  total: number;
  cardTotal: number;
  missingItemIds: string[];
  items: StoreComparisonItemDto[];
}

export interface StoreComparisonDto {
  shoppingListId: string;
  currency: string;
  /** Só itens por comprar. */
  itemCount: number;
  unpricedItems: { itemId: string; label: string; reason: UnpricedItemReason }[];
  /** Por cobertura, depois total. */
  stores: StoreComparisonStoreDto[];
  split: {
    coveredItemCount: number;
    storeCount: number;
    total: number;
    cardTotal: number;
    bestStoreId: string | null;
    savingVsBestStore: number;
    cardSavingVsBestStore: number;
    items: { itemId: string; storeId: string; productId: string; lineTotal: number }[];
  };
}

export function getStoreComparison(householdId: string, listId: string): Promise<StoreComparisonDto> {
  return authedRequest<StoreComparisonDto>(`${listPath(householdId, listId)}/store-comparison`);
}
