import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { useHouseholds } from "./useHouseholds";

/** Para ecrãs de casa: espera pela casa atual, ou manda criar uma se não houver nenhuma. */
export function HouseholdGate({
  children,
  withoutHousehold = <Navigate to="/casa/nova" replace />,
}: {
  children: (household: CallerHouseholdDto) => ReactNode;
  /** O que mostrar sem casas; por omissão, manda criar uma. */
  withoutHousehold?: ReactNode;
}) {
  const { loading, error, current } = useHouseholds();

  if (loading) return <p className="muted loading">A carregar…</p>;
  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (!current) return withoutHousehold;
  return children(current);
}
