import { useSyncExternalStore } from "react";
import type { Session } from "./session";
import { sessionStore } from "./sessionStore";

/** Sessão atual; muda também quando outro separador entra, sai ou renova. */
export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSession);
}
