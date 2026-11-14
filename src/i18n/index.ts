// Textos da app em português e inglês. O português é a fonte: o tipo `Dict`
// sai dele, e o inglês tem de ter exatamente as mesmas chaves.
//
// Nos componentes: `const t = useT();` e `t.pantry.title`. Fora do React
// (rótulos, mensagens de erro, formatadores): `tr()` devolve o dicionário da
// língua atual. A app remonta quando a língua muda (ver main.tsx), por isso
// basta ler o texto durante o render.

import { useSyncExternalStore } from "react";
import { en } from "./en";
import { getLanguage, subscribeLanguage, type Lang } from "./language";
import { pt } from "./pt";

export type Dict = typeof pt;

const dicts: Record<Lang, Dict> = { pt, en };

/** O dicionário da língua atual, para código fora dos componentes. */
export function tr(): Dict {
  return dicts[getLanguage()];
}

export function useLanguage(): Lang {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

export function useT(): Dict {
  return dicts[useLanguage()];
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
