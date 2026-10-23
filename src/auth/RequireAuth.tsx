import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./useSession";

/** Sem sessão, manda para o login e volta aqui depois de entrar. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/entrar?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}
