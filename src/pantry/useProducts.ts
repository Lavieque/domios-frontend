import { useEffect, useState } from "react";
import { getProduct, getProductsBatch, MAX_BATCH_PRODUCT_IDS } from "../api/client";
import { ApiError } from "../api/http";
import type { ProductDto } from "../api/types";

// Os itens da despensa e das listas só trazem o productId; os produtos lêem-se
// uma vez por sessão de página (o catálogo muda pouco) e partilham-se entre ecrãs.
const cache = new Map<string, Promise<ProductDto | null>>();

// Enquanto a Api em produção não tiver `GET /products/batch`, o 404 faz voltar
// aos pedidos um a um, e não se tenta outra vez até recarregar a página.
let batchUnavailable = false;

function loadOne(productId: string): Promise<ProductDto | null> {
  return getProduct(productId).catch(() => null);
}

async function loadBatch(productIds: string[]): Promise<Map<string, ProductDto | null>> {
  const found = new Map<string, ProductDto | null>();
  if (!batchUnavailable) {
    try {
      for (let i = 0; i < productIds.length; i += MAX_BATCH_PRODUCT_IDS) {
        const chunk = productIds.slice(i, i + MAX_BATCH_PRODUCT_IDS);
        for (const product of await getProductsBatch(chunk)) found.set(product.productId, product);
      }
      for (const id of productIds) if (!found.has(id)) found.set(id, null);
      return found;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) batchUnavailable = true;
      found.clear();
    }
  }
  const loaded = await Promise.all(productIds.map(loadOne));
  productIds.forEach((id, n) => found.set(id, loaded[n]));
  return found;
}

/** Pede de uma vez os que ainda não estão em cache; os outros reutilizam o pedido existente. */
export function loadProducts(productIds: string[]): Promise<(ProductDto | null)[]> {
  const missing = productIds.filter((id) => !cache.has(id));
  if (missing.length > 0) {
    const batch = loadBatch(missing);
    for (const id of missing) {
      const pending = batch.then((found) => found.get(id) ?? null);
      // Um produto que falhou (ou ainda não existe) volta a ser pedido da próxima vez.
      void pending.then((product) => {
        if (product === null && cache.get(id) === pending) cache.delete(id);
      });
      cache.set(id, pending);
    }
  }
  return Promise.all(productIds.map((id) => cache.get(id) ?? Promise.resolve(null)));
}

/** Produtos por id; os que ainda não chegaram ficam de fora do mapa. */
export function useProducts(productIds: string[]): Map<string, ProductDto> {
  const [products, setProducts] = useState<Map<string, ProductDto>>(new Map());
  const key = [...new Set(productIds)].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    loadProducts(key.split(",")).then((loaded) => {
      if (cancelled) return;
      setProducts(new Map(loaded.filter((p): p is ProductDto => p !== null).map((p) => [p.productId, p])));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return products;
}

/** Só para testes. */
export function resetProductsCache() {
  cache.clear();
  batchUnavailable = false;
}
