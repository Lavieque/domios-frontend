import { en } from "./en";
import { pt } from "./pt";
import { FEATURE_KEYS, LANGS, type Dict, type FeatureKey, type Lang } from "./types";

export { FEATURE_KEYS, LANGS };
export type { Dict, FeatureKey, Lang };

export const dicts: Record<Lang, Dict> = { pt, en };

/** Portuguese is the default language and lives at the root; English lives under /en. */
const BASE: Record<Lang, string> = { pt: "", en: "/en" };
const SEGMENT: Record<Lang, { features: string; guide: string; request: string }> = {
  pt: { features: "menus", guide: "guia", request: "pedir-acesso" },
  en: { features: "features", guide: "guide", request: "request-access" },
};

export type Route =
  | { kind: "home" }
  | { kind: "features" }
  | { kind: "feature"; key: FeatureKey }
  | { kind: "guide" }
  | { kind: "request" }
  | { kind: "notFound" };

export function langOf(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pt";
}

export function parseRoute(pathname: string): { lang: Lang; route: Route } {
  const lang = langOf(pathname);
  const rest = pathname.slice(BASE[lang].length).replace(/^\/+|\/+$/g, "");
  const [first, second, ...more] = rest.split("/");
  const seg = SEGMENT[lang];
  if (more.length > 0) return { lang, route: { kind: "notFound" } };
  if (!first) return { lang, route: { kind: "home" } };
  if (first === seg.guide && !second) return { lang, route: { kind: "guide" } };
  if (first === seg.request && !second) return { lang, route: { kind: "request" } };
  if (first === seg.features) {
    if (!second) return { lang, route: { kind: "features" } };
    const key = FEATURE_KEYS.find((k) => dicts[lang].features[k].slug === second);
    if (key) return { lang, route: { kind: "feature", key } };
  }
  return { lang, route: { kind: "notFound" } };
}

export function pathFor(lang: Lang, route: Route): string {
  const base = BASE[lang];
  const seg = SEGMENT[lang];
  switch (route.kind) {
    case "home":
      return base || "/";
    case "features":
      return `${base}/${seg.features}`;
    case "feature":
      return `${base}/${seg.features}/${dicts[lang].features[route.key].slug}`;
    case "guide":
      return `${base}/${seg.guide}`;
    case "request":
      return `${base}/${seg.request}`;
    case "notFound":
      return base || "/";
  }
}

/** The same page in another language (the home when the page has no twin). */
export function switchLanguage(pathname: string, to: Lang): string {
  const { route } = parseRoute(pathname);
  return pathFor(to, route);
}
