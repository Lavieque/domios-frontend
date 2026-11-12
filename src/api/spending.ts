// Gastos da casa e últimas compras de um produto (DomiOS_API_Fase1.md, adenda 2026-11-09).

import { authedRequest } from "../auth/sessionStore";
import type { QuantityDto } from "./pantry";
import type { MoneyDto, PaidPriceSource } from "./shopping";

export interface SpendingChainDto {
  /** null: compras sem loja. */
  chainId: string | null;
  chainName: string | null;
  total: number;
  typed: number;
  estimated: number;
  purchases: number;
}

export interface SpendingMonthDto {
  /** yyyy-MM */
  month: string;
  total: number;
  typed: number;
  estimated: number;
  purchasesWithoutPrice: number;
  chains: SpendingChainDto[];
}

/** `estimated` é a parte feita de preços da prateleira; as compras sem preço não entram em nenhum total. */
export interface SpendingDto {
  from: string;
  to: string;
  currency: string;
  total: number;
  typed: number;
  estimated: number;
  purchasesWithoutPrice: number;
  months: SpendingMonthDto[];
}

/** Datas yyyy-MM-dd; sem elas, os últimos 6 meses. Máximo 24 meses. */
export function getSpending(householdId: string, from?: string, to?: string): Promise<SpendingDto> {
  return authedRequest<SpendingDto>(`/households/${householdId}/spending`, { params: { from, to } });
}

export interface ProductPurchaseDto {
  purchasedAt: string;
  chainId: string | null;
  chainName: string | null;
  physicalStoreId: string | null;
  physicalStoreName: string | null;
  quantity: QuantityDto;
  paidPrice: MoneyDto | null;
  paidPriceSource: PaidPriceSource | null;
}

/** Mais recentes primeiro; `limit` 1..50. */
export function getProductPurchases(householdId: string, productId: string, limit = 10): Promise<{ items: ProductPurchaseDto[] }> {
  return authedRequest<{ items: ProductPurchaseDto[] }>(`/households/${householdId}/products/${productId}/purchases`, {
    params: { limit },
  });
}
