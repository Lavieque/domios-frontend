import { useEffect, useState } from "react";
import { getProductStoreOffers, getStoreOffersBatch, MAX_BATCH_PRODUCT_IDS } from "../api/client";
import { ApiError } from "../api/http";
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

// Os cartões de uma lista pedem as ofertas cada um no seu efeito, no mesmo tick:
// juntam-se aqui e saem num só GET /products/batch/store-offers.
type Waiter = (offers: ProductStoreOfferDto[] | null) => void;
let queued = new Map<string, Waiter>();
let flushScheduled = false;

// Enquanto a Api em produção não tiver o pedido em lote, o 404 faz voltar aos
// pedidos um a um, e não se tenta outra vez até recarregar a página.
let batchUnavailable = false;

async function loadBatch(productIds: string[]): Promise<Map<string, ProductStoreOfferDto[] | null>> {
  const found = new Map<string, ProductStoreOfferDto[] | null>();
  if (!batchUnavailable) {
    try {
      for (let i = 0; i < productIds.length; i += MAX_BATCH_PRODUCT_IDS) {
        const result = await getStoreOffersBatch(productIds.slice(i, i + MAX_BATCH_PRODUCT_IDS));
        for (const [productId, offers] of Object.entries(result)) found.set(productId, offers);
      }
      for (const id of productIds) if (!found.has(id)) found.set(id, []);
      return found;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) batchUnavailable = true;
      found.clear();
    }
  }
  const loaded = await Promise.all(productIds.map((id) => getProductStoreOffers(id).catch(() => null)));
  productIds.forEach((id, n) => found.set(id, loaded[n]));
  return found;
}

function flush() {
  flushScheduled = false;
  const batch = queued;
  queued = new Map();
  void loadBatch([...batch.keys()]).then((found) => {
    for (const [id, resolve] of batch) resolve(found.get(id) ?? null);
  });
}

export function loadOffers(productId: string): Promise<ProductStoreOfferDto[] | null> {
  let pending = cache.get(productId);
  if (!pending) {
    pending = new Promise<ProductStoreOfferDto[] | null>((resolve) => queued.set(productId, resolve));
    // Uma falha não fica em cache: o próximo pedido tenta de novo.
    const current = pending;
    void current.then((offers) => {
      if (offers === null && cache.get(productId) === current) cache.delete(productId);
    });
    cache.set(productId, pending);
    if (!flushScheduled) {
      flushScheduled = true;
      setTimeout(flush, 0);
    }
  }
  return pending;
}

/** Só para testes. */
export function resetOffersCache() {
  cache.clear();
  queued = new Map();
  flushScheduled = false;
  batchUnavailable = false;
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
