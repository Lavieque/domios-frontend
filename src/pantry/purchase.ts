import type { PantryItemDto } from "../api/pantry";
// Só tipos: o módulo shopping arrasta a sessão (window.localStorage) e não corre nos testes.
import type { PaidPriceSource } from "../api/shopping";
import type { ChainDto } from "../api/types";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const money = numberFormat({ style: "currency", currency: "EUR" });

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
      (item.purchasedPriceSource === ("Offer" satisfies PaidPriceSource) ? tr().ui.purchase.shelf : "")
    : null;
  const store = storeLabel(chainName, item.purchasedPhysicalStoreName ?? undefined);
  const t = tr().ui.purchase;
  if (store && price) return `${t.bought(store)} · ${price}`;
  if (store) return t.bought(store);
  if (price) return t.paid(price);
  return null;
}

function storeLabel(chainName: string | undefined, physicalName: string | undefined): string | null {
  const physical = physicalName?.trim();
  if (physical && (!chainName || physical.toLocaleLowerCase("pt").includes(chainName.toLocaleLowerCase("pt")))) {
    return tr().ui.purchase.atStore(physical);
  }
  if (chainName && physical) return `${tr().ui.purchase.atChain(chainName)} (${physical})`;
  if (chainName) return tr().ui.purchase.atChain(chainName);
  return null;
}
