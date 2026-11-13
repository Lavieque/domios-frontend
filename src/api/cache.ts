// Cache em memória das respostas GET (JSON). Serve para que voltar a uma página
// já vista, ou dois componentes que pedem a mesma coisa, não esperem outra vez
// pela Api.
//
// - Pedidos iguais em voo partilham o mesmo fetch.
// - Guarda o texto da resposta e faz parse a cada leitura, para que ninguém
//   altere (ex. `.sort()`) o que outro ecrã vai receber.
// - Qualquer escrita (POST/PATCH/PUT/DELETE) limpa tudo: o que se acabou de
//   mudar nunca aparece com o valor antigo.
// - Trocar de sessão (entrar, sair, outro utilizador) também limpa tudo.

/** Catálogo (sem sessão): produtos, receitas, promoções. Muda poucas vezes ao dia. */
export const CATALOG_TTL_MS = 5 * 60_000;
/** Dados da casa: outro membro pode mudá-los, por isso duram menos. */
export const HOUSEHOLD_TTL_MS = 60_000;

interface Entry {
  text: Promise<string>;
  expiresAt: number;
}

const entries = new Map<string, Entry>();
let now: () => number = Date.now;

/**
 * Devolve o texto em cache para `key`, ou chama `load` e guarda-o. Um `load`
 * que falha não fica em cache: o próximo pedido tenta de novo.
 */
export function cachedText(key: string, ttlMs: number, load: () => Promise<string>): Promise<string> {
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now()) return hit.text;

  const text = load();
  const entry: Entry = { text, expiresAt: now() + ttlMs };
  entries.set(key, entry);
  text.catch(() => {
    if (entries.get(key) === entry) entries.delete(key);
  });
  return text;
}

export function clearApiCache(): void {
  entries.clear();
}

/** Só para testes. */
export function setCacheClock(clock: () => number): void {
  now = clock;
}
