import { useLoad } from "../useLoad";
import { loadOffers, isOnSale } from "../catalog/offers";
import type { ShoppingItemPackagingDto, ShoppingListItemDto } from "../api/shopping";
import type { ProductDto, ProductStoreOfferDto } from "../api/types";

/** A média dos preços de prateleira das ofertas à venda; `null` sem nenhuma. */
export function averageShelfPrice(offers: ProductStoreOfferDto[] | null | undefined): number | null {
  const prices = (offers ?? []).filter(isOnSale).map((offer) => offer.latestPrice!.price.amount);
  if (prices.length === 0) return null;
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

/**
 * Quantas embalagens a linha pede: as da Api (linhas só com ingrediente), senão a conta pela quantidade
 * quando a unidade do produto é a da linha, senão uma.
 */
export function packagesFor(
  item: Pick<ShoppingListItemDto, "quantity" | "shoppingListItemId">,
  product: Pick<ProductDto, "packageQuantity" | "packageUnit"> | null | undefined,
  packaging: ShoppingItemPackagingDto | undefined,
): number {
  if (packaging) return Math.max(1, packaging.packageCount);
  if (product && product.packageUnit === item.quantity.unit && product.packageQuantity > 0) {
    return Math.max(1, Math.ceil(item.quantity.amount / product.packageQuantity));
  }
  return 1;
}

/**
 * O preço esperado de cada linha por comprar: a média das lojas vezes as embalagens. Só as linhas com
 * produto (próprio ou o da embalagem) e com ofertas à venda entram; as outras ficam sem preço.
 */
export function useExpectedPrices(
  items: ShoppingListItemDto[],
  products: Map<string, ProductDto | null>,
  packaging: Map<string, ShoppingItemPackagingDto>,
): Map<string, number> {
  const productIdOf = (item: ShoppingListItemDto) => item.productId ?? packaging.get(item.shoppingListItemId)?.productId ?? null;
  const ids = [...new Set(items.flatMap((item) => productIdOf(item) ?? []))].sort();
  const offers = useLoad(ids.length > 0 ? ["expected-prices", ...ids] : null, async () => {
    const loaded = await Promise.all(ids.map((id) => loadOffers(id)));
    return new Map(ids.map((id, n) => [id, loaded[n]] as const));
  });

  const result = new Map<string, number>();
  for (const item of items) {
    const productId = productIdOf(item);
    const average = productId ? averageShelfPrice(offers.data?.get(productId)) : null;
    if (productId && average !== null) {
      result.set(item.shoppingListItemId, average * packagesFor(item, products.get(productId), packaging.get(item.shoppingListItemId)));
    }
  }
  return result;
}
