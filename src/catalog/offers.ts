import { useEffect, useState } from "react";
import { getProductStoreOffers } from "../api/client";
import {
  measurementUnitLabels,
  type MeasurementUnit,
  MeasurementUnit as Unit,
  type ProductStoreOfferDto,
  StoreOfferAvailability,
} from "../api/types";

export const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const plain = new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

/** "0,89" — o símbolo vai à parte na etiqueta. */
export function priceDigits(amount: number): string {
  return plain.format(amount);
}

export function formatPercent(value: number): string {
  return `${percent.format(value)}%`;
}

/** Unidade de referência do preço unitário: €/kg, €/L, €/un. */
const perLabels: Record<MeasurementUnit, string> = {
  [Unit.Unit]: "un",
  [Unit.Gram]: "g",
  [Unit.Kilogram]: "kg",
  [Unit.Milliliter]: "ml",
  [Unit.Liter]: "L",
};

export function unitPriceLabel(offer: Pick<ProductStoreOfferDto, "unitPrice">): string | null {
  if (!offer.unitPrice) return null;
  return `${money.format(offer.unitPrice.amount)}/${perLabels[offer.unitPrice.per] ?? measurementUnitLabels[offer.unitPrice.per]}`;
}

/**
 * Com preço e ainda à venda: o scraper passa a OutOfStock as ofertas que
 * saíram do site, que guardam o último preço que tiveram.
 */
export function isOnSale(offer: ProductStoreOfferDto): boolean {
  return offer.latestPrice !== null && offer.availability !== StoreOfferAvailability.OutOfStock;
}

/**
 * Ofertas à venda, da mais barata para a mais cara; depois as indisponíveis
 * e por fim as sem preço.
 */
export function sortOffers(offers: ProductStoreOfferDto[]): ProductStoreOfferDto[] {
  const rank = (offer: ProductStoreOfferDto) => (isOnSale(offer) ? 0 : offer.latestPrice ? 1 : 2);
  return [...offers].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return (a.latestPrice?.price.amount ?? 0) - (b.latestPrice?.price.amount ?? 0);
  });
}

// As ofertas de um produto lêem-se uma vez por sessão de página e partilham-se
// entre a lista e o detalhe; GET /products não traz preços.
const cache = new Map<string, Promise<ProductStoreOfferDto[] | null>>();

export function loadOffers(productId: string): Promise<ProductStoreOfferDto[] | null> {
  let pending = cache.get(productId);
  if (!pending) {
    pending = getProductStoreOffers(productId).catch(() => {
      cache.delete(productId);
      return null;
    });
    cache.set(productId, pending);
  }
  return pending;
}

/** undefined enquanto carrega; null se falhou. */
export function useOffers(productId: string): ProductStoreOfferDto[] | null | undefined {
  const [offers, setOffers] = useState<ProductStoreOfferDto[] | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setOffers(undefined);
    loadOffers(productId).then((result) => !cancelled && setOffers(result));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return offers;
}
