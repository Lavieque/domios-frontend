import { useCallback, useEffect, useState } from "react";
import type { CallerHouseholdDto } from "../api/households";
import { fetchHouseholds } from "./fetchHouseholds";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import {
  HOUSEHOLDS_CHANGED,
  getStoredHouseholdId,
  getStoredHouseholds,
  pickHouseholdId,
  storeHouseholdId,
  storeHouseholds,
} from "./currentHousehold";

interface HouseholdsState {
  loading: boolean;
  error: string | null;
  households: CallerHouseholdDto[];
  current: CallerHouseholdDto | null;
  select: (householdId: string) => void;
  /** Volta a pedir a lista, ex. depois de sair de uma casa. */
  reload: () => void;
}

interface State {
  userId: string | null;
  households: CallerHouseholdDto[];
  currentId: string | null;
  loading: boolean;
  error: string | null;
  /** Já há uma lista no ecrã: ao revalidar (outra casa criada, saída) fica com ela em vez de voltar ao esqueleto. */
  shown: boolean;
}

/** A última lista vista e a casa escolhida, para arrancar sem esperar pela Api. */
function fromStorage(userId: string | null): State {
  const households = userId ? getStoredHouseholds(userId) : null;
  const currentId =
    userId && households ? pickHouseholdId(households.map((h) => h.householdId), getStoredHouseholdId(userId)) : null;
  return { userId, households: households ?? [], currentId, loading: households === null, error: null, shown: households !== null };
}

/**
 * As casas do utilizador (`GET /households`) e a casa escolhida neste browser.
 * Com uma lista guardada de uma visita anterior, começa já com ela (sem
 * `loading`) e os ecrãs da casa pedem os seus dados em paralelo com a lista;
 * quando a lista chega, substitui a guardada.
 */
export function useHouseholds(): HouseholdsState {
  const userId = useSession()?.userId ?? null;
  let [state, setState] = useState(() => fromStorage(userId));
  // Outro utilizador (entrou ou saiu): recomeça já neste render com o que este browser guardou dele.
  if (state.userId !== userId) {
    state = fromStorage(userId);
    setState(state);
  }
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchHouseholds(userId)
      .then((result) => {
        if (cancelled) return;
        storeHouseholds(userId, result);
        setState((s) => ({
          ...s,
          households: result,
          currentId: pickHouseholdId(result.map((h) => h.householdId), getStoredHouseholdId(userId)),
          loading: false,
          error: null,
          shown: true,
        }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Com uma lista já no ecrã, uma falha ao revalidar não tapa a página.
        setState((s) => ({ ...s, loading: false, error: s.shown ? s.error : describeError(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Outro ecrã mudou as casas (criou uma, saiu de uma): esta instância também volta a pedir.
  useEffect(() => {
    window.addEventListener(HOUSEHOLDS_CHANGED, reload);
    return () => window.removeEventListener(HOUSEHOLDS_CHANGED, reload);
  }, [reload]);

  const select = useCallback(
    (householdId: string) => {
      if (!userId) return;
      storeHouseholdId(userId, householdId);
      setState((s) => ({ ...s, currentId: householdId }));
    },
    [userId],
  );

  return {
    loading: state.loading,
    error: state.error,
    households: state.households,
    current: state.households.find((h) => h.householdId === state.currentId) ?? null,
    select,
    reload,
  };
}
