import { useCallback, useEffect, useState } from "react";
import { listMyHouseholds, type CallerHouseholdDto } from "../api/households";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import {
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

/** A última lista vista e a casa escolhida, para arrancar sem esperar pela Api. */
function fromStorage(userId: string | null) {
  const households = userId ? getStoredHouseholds(userId) : null;
  const currentId =
    userId && households ? pickHouseholdId(households.map((h) => h.householdId), getStoredHouseholdId(userId)) : null;
  return { households, currentId };
}

/**
 * As casas do utilizador (`GET /households`) e a casa escolhida neste browser.
 * Com uma lista guardada de uma visita anterior, começa já com ela (sem
 * `loading`) e os ecrãs da casa pedem os seus dados em paralelo com a lista;
 * quando a lista chega, substitui a guardada.
 */
export function useHouseholds(): HouseholdsState {
  const userId = useSession()?.userId ?? null;
  const [initial] = useState(() => fromStorage(userId));
  const [households, setHouseholds] = useState<CallerHouseholdDto[]>(initial.households ?? []);
  const [currentId, setCurrentId] = useState<string | null>(initial.currentId);
  const [loading, setLoading] = useState(initial.households === null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const stored = fromStorage(userId);
    if (stored.households) {
      setHouseholds(stored.households);
      setCurrentId(stored.currentId);
    } else {
      setLoading(true);
    }
    listMyHouseholds()
      .then((result) => {
        if (cancelled) return;
        storeHouseholds(userId, result);
        setHouseholds(result);
        setCurrentId(pickHouseholdId(result.map((h) => h.householdId), getStoredHouseholdId(userId)));
        setError(null);
      })
      .catch((err: unknown) => {
        // Com a lista guardada já no ecrã, uma falha ao revalidar não tapa a página.
        if (!cancelled && !stored.households) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const select = useCallback(
    (householdId: string) => {
      if (!userId) return;
      storeHouseholdId(userId, householdId);
      setCurrentId(householdId);
    },
    [userId],
  );

  return {
    loading,
    error,
    households,
    current: households.find((h) => h.householdId === currentId) ?? null,
    select,
    reload,
  };
}
