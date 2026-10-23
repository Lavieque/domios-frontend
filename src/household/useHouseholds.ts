import { useCallback, useEffect, useState } from "react";
import { listMyHouseholds, type CallerHouseholdDto } from "../api/households";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import { getStoredHouseholdId, pickHouseholdId, storeHouseholdId } from "./currentHousehold";

interface HouseholdsState {
  loading: boolean;
  error: string | null;
  households: CallerHouseholdDto[];
  current: CallerHouseholdDto | null;
  select: (householdId: string) => void;
}

/** As casas do utilizador (`GET /households`) e a casa escolhida neste browser. */
export function useHouseholds(): HouseholdsState {
  const userId = useSession()?.userId ?? null;
  const [households, setHouseholds] = useState<CallerHouseholdDto[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    listMyHouseholds()
      .then((result) => {
        if (cancelled) return;
        setHouseholds(result);
        setCurrentId(pickHouseholdId(result.map((h) => h.householdId), getStoredHouseholdId(userId)));
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

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
  };
}
