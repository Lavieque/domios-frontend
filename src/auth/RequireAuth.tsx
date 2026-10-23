import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "./useSession";

/** Rota-pai das páginas que exigem sessão: sem ela, manda para o login e volta aqui depois de entrar. */
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    const next = `${location.pathname}${location.search}`;
    const query = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
    return <Navigate to={`/entrar${query}`} replace />;
  }
  return <Outlet />;
}
