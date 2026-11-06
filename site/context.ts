import { createContext, useContext } from "react";
import { pathFor, type Dict, type Lang, type Route } from "./i18n";

export interface SiteContext {
  lang: Lang;
  t: Dict;
  /** Path of a route in the current language. */
  to: (route: Route) => string;
}

const Ctx = createContext<SiteContext | null>(null);
export const SiteProvider = Ctx.Provider;

export function useSite(): SiteContext {
  const value = useContext(Ctx);
  if (!value) throw new Error("useSite outside SiteProvider");
  return value;
}

export function makeContext(lang: Lang, t: Dict): SiteContext {
  return { lang, t, to: (route) => pathFor(lang, route) };
}
