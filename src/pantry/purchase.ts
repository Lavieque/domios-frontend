import type { PantryItemDto } from "../api/pantry";
// Só tipos: o módulo shopping arrasta a sessão (window.localStorage) e não corre nos testes.
import type { PaidPriceSource } from "../api/shopping";
import type { ChainDto } from "../api/types";

const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

/**
 * "Comprado no Continente · 1,29 €", "Pago 1,29 € (prateleira)", "Comprado no Lidl" ou `null` sem preço nem loja.
 * Com a loja física: "Comprado no Pingo Doce Telheiras" quando o nome já traz a cadeia, senão
 * "Comprado no Lidl (Lidl Benfica)". Uma cadeia que já não está aberta (ou que ainda não chegou) fica de fora
 * em vez de mostrar um id; a loja física vale sozinha nesse caso.
 */
export function describePurchase(
  item: Pick<PantryItemDto, "purchasedPrice" | "purchasedChainId" | "purchasedPriceSource" | "purchasedPhysicalStoreName">,
  chains: ChainDto[] | null,
): string | null {
  const chainName = item.purchasedChainId ? chains?.find((c) => c.chainId === item.purchasedChainId)?.name : undefined;
  const price = item.purchasedPrice
    ? money.format(item.purchasedPrice.amount) +
      (item.purchasedPriceSource === ("Offer" satisfies PaidPriceSource) ? " (prateleira)" : "")
    : null;
  const store = storeLabel(chainName, item.purchasedPhysicalStoreName ?? undefined);
  if (store && price) return `Comprado ${store} · ${price}`;
  if (store) return `Comprado ${store}`;
  if (price) return `Pago ${price}`;
  return null;
}

function storeLabel(chainName: string | undefined, physicalName: string | undefined): string | null {
  const physical = physicalName?.trim();
  if (physical && (!chainName || physical.toLocaleLowerCase("pt").includes(chainName.toLocaleLowerCase("pt")))) {
    return `em ${physical}`;
  }
  if (chainName && physical) return `no ${chainName} (${physical})`;
  if (chainName) return `no ${chainName}`;
  return null;
}
