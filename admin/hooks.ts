import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ApiError, subscribe, type Session } from "./api";

const KEY = "domios.admin.session";

export function useSession(): Session | null {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY));
  return useMemo(() => (raw ? (JSON.parse(raw) as Session) : null), [raw]);
}

export interface Loaded<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Carrega ao montar e sempre que `deps` mudam; `reload` repete sem piscar o conteúdo atual. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  useEffect(() => {
    let live = true;
    setLoading(true);
    run()
      .then((result) => {
        if (live) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (live) setError(describe(err));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [run, tick]);

  return { data, loading, error, reload: () => setTick((n) => n + 1) };
}

export function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.type === "network") return "Sem ligação à Api. Verifica a rede e tenta de novo.";
    if (err.status === 403) return "Sem permissão para esta ação.";
    if (/last Admin/i.test(err.message)) return "Uma casa não pode ficar sem administrador: promove outro membro primeiro.";
    if (err.status === 404) return "Isto já não existe.";
    return err.message || `Erro ${err.status}.`;
  }
  return "Algo correu mal. Tenta de novo.";
}

export const dateTime = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Lisbon" });
export const dateOnly = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });
