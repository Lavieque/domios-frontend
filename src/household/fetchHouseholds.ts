import { listMyHouseholds, type CallerHouseholdDto } from "../api/households";
import { householdsGeneration } from "./currentHousehold";

/** Quanto tempo a última lista serve sem voltar a perguntar (navegar entre páginas). */
const FRESH_MS = 30_000;

let inflight: { userId: string; generation: number; promise: Promise<CallerHouseholdDto[]> } | null = null;
let cached: { userId: string; generation: number; at: number; value: CallerHouseholdDto[] } | null = null;

/**
 * `GET /households` partilhado por todas as instâncias de `useHouseholds` (barra, menu, página):
 * um só pedido em voo, e a resposta serve durante 30 s a quem montar a seguir (cada página da casa
 * montava a sua e pedia outra vez). Depois de `householdsChanged` (casa criada, saída), nem a
 * resposta guardada nem um pedido que já ia a meio servem: pergunta-se outra vez.
 */
export function fetchHouseholds(userId: string): Promise<CallerHouseholdDto[]> {
  const generation = householdsGeneration();
  const same = (entry: { userId: string; generation: number } | null) =>
    entry !== null && entry.userId === userId && entry.generation === generation;
  if (same(cached) && Date.now() - cached!.at < FRESH_MS) return Promise.resolve(cached!.value);
  if (same(inflight)) return inflight!.promise;
  const promise = listMyHouseholds()
    .then((value) => {
      cached = { userId, generation, at: Date.now(), value };
      return value;
    })
    .finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });
  inflight = { userId, generation, promise };
  return promise;
}
