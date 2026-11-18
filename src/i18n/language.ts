// Língua da interface da app. Só o texto da própria app muda; os dados que vêm
// da Api (nomes de produtos, receitas, lojas, categorias) ficam como estão.
//
// A escolha vive na conta (GET/PUT /account/preferences, DomiOS_API_Fase3.md,
// adenda 2026-11-13). Aqui guarda-se também uma cópia local, para o arranque e
// os ecrãs sem sessão (entrar, registo) já abrirem na língua certa.

export type Lang = "pt" | "en";
export const LANGS: readonly Lang[] = ["pt", "en"];

export const LANGUAGE_STORAGE_KEY = "domios.language";

/** Locale do `Intl`: o inglês usa o formato europeu (dia antes do mês, euros). */
const LOCALE: Record<Lang, string> = { pt: "pt-PT", en: "en-GB" };

export function isLang(value: unknown): value is Lang {
  return value === "pt" || value === "en";
}

function initialLanguage(): Lang {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Sem localStorage (modo privado antigo): cai para a língua do browser.
  }
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) return "en";
  return "pt";
}

let current: Lang = typeof window === "undefined" ? "pt" : initialLanguage();
const listeners = new Set<() => void>();

function applyToDocument(lang: Lang) {
  if (typeof document !== "undefined") document.documentElement.lang = LOCALE[lang];
}
applyToDocument(current);

export function getLanguage(): Lang {
  return current;
}

export function localeOf(lang: Lang = current): string {
  return LOCALE[lang];
}

/**
 * Carrega o dicionário de uma língua; `null` quando já está carregado. O índice
 * (`./index.ts`) regista-o, para este módulo não depender dos dicionários.
 */
type Loader = (lang: Lang) => Promise<void> | null;
let loader: Loader = () => null;

export function registerLanguageLoader(load: Loader): void {
  loader = load;
}

/** A última língua pedida: um pedido mais recente ganha a um que ainda carrega. */
let requested: Lang = current;

function switchTo(lang: Lang) {
  if (lang === current) return;
  current = lang;
  applyToDocument(lang);
  for (const listener of listeners) listener();
}

/**
 * Muda a língua neste browser (e nos outros separadores, pelo evento `storage`).
 * Se o dicionário ainda não chegou, a app só muda quando chegar; a promessa
 * resolve nesse momento.
 */
export function setLanguage(lang: Lang): Promise<void> {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Sem localStorage: vale só para esta página.
  }
  requested = lang;
  const loading = loader(lang);
  if (!loading) {
    switchTo(lang);
    return Promise.resolve();
  }
  return loading.then(() => {
    if (requested === lang) switchTo(lang);
  });
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === LANGUAGE_STORAGE_KEY && isLang(event.newValue)) void setLanguage(event.newValue);
  });
}
