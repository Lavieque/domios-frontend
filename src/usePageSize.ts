import { useSyncExternalStore } from "react";

/** A mesma largura em que a app passa à barra de baixo (editorial-mobile.css). */
const PHONE_QUERY = "(max-width: 899px)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function isPhone() {
  return typeof window.matchMedia === "function" && window.matchMedia(PHONE_QUERY).matches;
}

/**
 * Quantos itens pedir por página. No telemóvel as listas ficam numa só coluna,
 * por isso pedem-se menos, para a página não ficar com um scroll enorme.
 */
export function usePageSize(desktop: number, phone: number): number {
  return useIsPhone() ? phone : desktop;
}

/** Se o ecrã é de telemóvel (a app com barra de baixo). */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, isPhone, () => false);
}
