// Textos da app em português e inglês. O português é a fonte: o tipo `Dict`
// sai dele, e o inglês tem de ter exatamente as mesmas chaves.
//
// Nos componentes: `const t = useT();` e `t.pantry.title`. Fora do React
// (rótulos, mensagens de erro, formatadores): `tr()` devolve o dicionário da
// língua atual. A app remonta quando a língua muda (ver main.tsx), por isso
// basta ler o texto durante o render.

import { useSyncExternalStore } from "react";
import { getLanguage, registerLanguageLoader, subscribeLanguage, type Lang } from "./language";
import { pt } from "./pt";

export type Dict = typeof pt;

// O português vai no pacote principal; o inglês é outro ficheiro, pedido só por
// quem o usa (no arranque, se for a língua guardada, ou ao mudar de língua).
const dicts: Partial<Record<Lang, Dict>> = { pt };
const loaders: Record<Exclude<Lang, "pt">, () => Promise<Dict>> = {
  en: () => import("./en").then((m) => m.en),
};
const loading = new Map<Lang, Promise<void>>();

/** Garante o dicionário da língua; o arranque espera por ele antes de mostrar a app. */
export function loadLanguage(lang: Lang): Promise<void> {
  if (dicts[lang]) return Promise.resolve();
  let promise = loading.get(lang);
  if (!promise) {
    promise = loaders[lang as Exclude<Lang, "pt">]()
      .then((dict) => {
        dicts[lang] = dict;
      })
      .finally(() => loading.delete(lang));
    loading.set(lang, promise);
  }
  return promise;
}

registerLanguageLoader((lang) => (dicts[lang] ? null : loadLanguage(lang)));

/** O dicionário da língua atual, para código fora dos componentes. */
export function tr(): Dict {
  // Até o inglês chegar, o português; o arranque e `setLanguage` esperam por ele.
  return dicts[getLanguage()] ?? pt;
}

export function useLanguage(): Lang {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

export function useT(): Dict {
  return dicts[useLanguage()] ?? pt;
}

/**
 * Um mapa de rótulos (por exemplo `Record<MeasurementUnit, string>`) que lê
 * sempre a língua atual: `labels[x]` continua a funcionar como antes.
 */
export function localized<T extends object>(pick: (dict: Dict) => T): T {
  return new Proxy({} as T, {
    get: (_, key) => Reflect.get(pick(tr()), key),
    has: (_, key) => Reflect.has(pick(tr()), key),
    ownKeys: () => Reflect.ownKeys(pick(tr())),
    getOwnPropertyDescriptor: (_, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(pick(tr()), key);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

export { getLanguage, LANGS, setLanguage, type Lang } from "./language";
