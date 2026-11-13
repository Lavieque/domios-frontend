import type { PantryItemDto } from "../api/pantry";
// Só tipos: o módulo shopping arrasta a sessão (window.localStorage) e não corre nos testes.
import type { PaidPriceSource } from "../api/shopping";
import type { ChainDto } from "../api/types";

const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

/**
 * "Comprado no Continente · 1,29 €", "Pago 1,29 € (prateleira)", "Comprado no Lidl" ou `null` sem preço nem loja.
 * A loja física só vem por id (a Api não manda o nome no item), por isso fica a cadeia.
 * Uma cadeia que já não está aberta (ou que ainda não chegou) fica de fora em vez de mostrar um id.
 */
export function describePurchase(
  item: Pick<PantryItemDto, "purchasedPrice" | "purchasedChainId" | "purchasedPriceSource">,
  chains: ChainDto[] | null,
): string | null {
  const chainName = item.purchasedChainId ? chains?.find((c) => c.chainId === item.purchasedChainId)?.name : undefined;
  const price = item.purchasedPrice
    ? money.format(item.purchasedPrice.amount) +
      (item.purchasedPriceSource === ("Offer" satisfies PaidPriceSource) ? " (prateleira)" : "")
    : null;
  if (chainName && price) return `Comprado no ${chainName} · ${price}`;
  if (chainName) return `Comprado no ${chainName}`;
  if (price) return `Pago ${price}`;
  return null;
}
