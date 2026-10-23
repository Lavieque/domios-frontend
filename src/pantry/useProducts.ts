import { useEffect, useState } from "react";
import { getProduct } from "../api/client";
import type { ProductDto } from "../api/types";

// Os itens da despensa só trazem o productId; os produtos lêem-se uma vez por
// sessão de página (o catálogo muda pouco) e partilham-se entre ecrãs.
const cache = new Map<string, Promise<ProductDto | null>>();

function load(productId: string): Promise<ProductDto | null> {
  let pending = cache.get(productId);
  if (!pending) {
    pending = getProduct(productId).catch(() => {
      cache.delete(productId);
      return null;
    });
    cache.set(productId, pending);
  }
  return pending;
}

/** Produtos por id; os que ainda não chegaram ficam de fora do mapa. */
export function useProducts(productIds: string[]): Map<string, ProductDto> {
  const [products, setProducts] = useState<Map<string, ProductDto>>(new Map());
  const key = [...new Set(productIds)].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    Promise.all(key.split(",").map(load)).then((loaded) => {
      if (cancelled) return;
      setProducts(new Map(loaded.filter((p): p is ProductDto => p !== null).map((p) => [p.productId, p])));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return products;
}
