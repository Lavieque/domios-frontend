import { useCallback, useEffect, useState } from "react";
import { describeError } from "./auth/errors";

export interface Loaded<T> {
  /** O resultado para a chave atual; `null` enquanto carrega, sem chave ou com erro. */
  data: T | null;
  /** O erro já em texto para o ecrã (`describeError`); `null` sem erro. */
  error: string | null;
  /** O erro tal como veio, para quem decide pelo código (ex. 404). */
  failure: unknown;
  /** A pedir para uma chave que ainda não tem resposta. Ao `reload`, os dados ficam no ecrã. */
  loading: boolean;
  /** Pede outra vez, mantendo os dados atuais até chegar a resposta. */
  reload: () => void;
  /** Muda os dados guardados (ex. depois de apagar um item), sem voltar a pedir. */
  update: (change: (data: T) => T) => void;
}

interface Result<T> {
  key: string;
  data: T | null;
  failure: unknown;
}

/**
 * Pede dados quando a chave muda e descarta respostas de chaves antigas. O
 * estado só muda quando a resposta chega: o "a carregar" deduz-se de a
 * resposta guardada ser de outra chave, sem `setState` dentro do efeito.
 *
 * `key` identifica o pedido (ex. `[householdId, page]`); `null` não pede nada.
 * `load` lê os valores do render em que a chave mudou. Com `delay`, espera esse
 * tempo sem a chave mudar antes de pedir (procura enquanto se escreve). Com
 * `keepPrevious`, mostra a resposta da chave anterior até chegar a nova.
 */
export function useLoad<T>(key: readonly unknown[] | null, load: () => Promise<T>, options: { delay?: number; keepPrevious?: boolean } = {}): Loaded<T> {
  const id = key === null ? null : JSON.stringify(key);
  const [result, setResult] = useState<Result<T> | null>(null);
  const [version, setVersion] = useState(0);
  const delay = options.delay ?? 0;

  useEffect(() => {
    if (id === null) return;
    let active = true;
    const run = () =>
      load().then(
        (data) => active && setResult({ key: id, data, failure: null }),
        (failure: unknown) => active && setResult({ key: id, data: null, failure: failure ?? new Error("load failed") }),
      );
    if (delay <= 0) {
      void run();
      return () => {
        active = false;
      };
    }
    const timer = setTimeout(run, delay);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // `load` fica de fora de propósito: muda a cada render, e a chave diz quando pedir.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [id, version, delay]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const update = useCallback(
    (change: (data: T) => T) =>
      setResult((current) => (current && current.key === id && current.data !== null ? { ...current, data: change(current.data) } : current)),
    [id],
  );

  const current = id !== null && result?.key === id ? result : null;
  return {
    data: current ? current.data : options.keepPrevious && id !== null ? (result?.data ?? null) : null,
    error: current?.failure ? describeError(current.failure) : null,
    failure: current?.failure ?? null,
    loading: id !== null && current === null,
    reload,
    update,
  };
}
