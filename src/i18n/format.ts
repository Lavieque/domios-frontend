// Formatadores `Intl` que seguem a língua atual. Substituem os
// `new Intl.NumberFormat("pt-PT", …)` ao nível do módulo: são criados uma vez
// por língua e escolhidos no momento de formatar.

import { getLanguage, localeOf, type Lang } from "./language";

interface Formatter<T, P> {
  format(value: T): string;
  formatToParts(value: T): P[];
}

function perLanguage<F>(create: (locale: string) => F): () => F {
  const cache: Partial<Record<Lang, F>> = {};
  return () => {
    const lang = getLanguage();
    return (cache[lang] ??= create(localeOf(lang)));
  };
}

export function numberFormat(options?: Intl.NumberFormatOptions): Formatter<number | bigint, Intl.NumberFormatPart> {
  const get = perLanguage((locale) => new Intl.NumberFormat(locale, options));
  return {
    format: (value) => get().format(value),
    formatToParts: (value) => get().formatToParts(value),
  };
}

export function dateTimeFormat(options?: Intl.DateTimeFormatOptions): Formatter<Date | number, Intl.DateTimeFormatPart> {
  const get = perLanguage((locale) => new Intl.DateTimeFormat(locale, options));
  return {
    format: (value) => get().format(value),
    formatToParts: (value) => get().formatToParts(value),
  };
}

/** Ordenação alfabética na língua atual. */
export function compareText(a: string, b: string): number {
  return a.localeCompare(b, localeOf());
}
export { localeOf } from "./language";
