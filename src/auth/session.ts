// Sessão do utilizador: access token + refresh token, guardados em
// localStorage (P1 de DomiOS_DataModel_Fase3.md, adenda 2026-10-22) para
// serem partilhados entre separadores.
//
// A Api roda o refresh token em cada refresh e trata um token já usado como
// roubo: termina a sessão (P4, sem tolerância). Por isso o refresh é
// serializado duas vezes — uma só promessa em voo dentro do separador, e um
// Web Lock entre separadores — e, dentro do lock, relê-se o storage: se outro
// separador já rodou o token, usa-se o dele em vez de gastar o antigo.

import { ApiError } from "../api/http";
import type { LoginResultDto } from "../api/auth";

export interface Session {
  userId: string;
  /** O email com que se entrou, só para mostrar (a Api não o devolve). */
  email: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  emailVerified: boolean;
}

export interface SessionStoreDeps {
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  refreshRequest: (refreshToken: string) => Promise<LoginResultDto>;
  now?: () => number;
  /** `navigator.locks.request`; sem ele, o refresh só é serializado dentro do separador. */
  lock?: <T>(name: string, task: () => Promise<T>) => Promise<T>;
  /** Avisa quando outro separador muda o storage (evento `storage`). */
  watchExternalChanges?: (onChange: () => void) => void;
}

export const SESSION_STORAGE_KEY = "domios.session";
const REFRESH_LOCK_NAME = "domios.session.refresh";
/** Renova o access token se faltar menos do que isto para expirar. */
export const ACCESS_TOKEN_MARGIN_MS = 60_000;

export type SessionStore = ReturnType<typeof createSessionStore>;

export function createSessionStore(deps: SessionStoreDeps) {
  const now = deps.now ?? Date.now;
  const lock = deps.lock ?? (<T,>(_name: string, task: () => Promise<T>) => task());
  const listeners = new Set<() => void>();

  let cachedRaw: string | null | undefined;
  let cachedSession: Session | null = null;
  let refreshInFlight: Promise<Session | null> | null = null;

  /** Devolve sempre o mesmo objeto enquanto o storage não muda (useSyncExternalStore). */
  function read(): Session | null {
    const raw = deps.storage.getItem(SESSION_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedSession = parse(raw);
    }
    return cachedSession;
  }

  function write(session: Session | null) {
    if (session) {
      deps.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      deps.storage.removeItem(SESSION_STORAGE_KEY);
    }
    notify();
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  async function refreshLocked(staleRefreshToken: string): Promise<Session | null> {
    const current = read();
    if (!current) return null;
    if (current.refreshToken !== staleRefreshToken) return current;
    if (Date.parse(current.refreshTokenExpiresAt) <= now()) {
      write(null);
      return null;
    }

    let result: LoginResultDto;
    try {
      result = await deps.refreshRequest(staleRefreshToken);
    } catch (error) {
      // 401 invalid-refresh-token: desconhecido, expirado, sessão terminada ou
      // já usado. Em todos os casos, volta-se ao login.
      if (error instanceof ApiError && error.status === 401) {
        if (read()?.refreshToken === staleRefreshToken) write(null);
        return null;
      }
      throw error;
    }

    // Saiu da sessão (ou entrou noutra) enquanto o pedido estava em voo.
    const afterRequest = read();
    if (afterRequest?.refreshToken !== staleRefreshToken) return afterRequest;

    const next = fromLoginResult(result, current.email);
    write(next);
    return next;
  }

  function refresh(staleRefreshToken: string): Promise<Session | null> {
    if (!refreshInFlight) {
      refreshInFlight = lock(REFRESH_LOCK_NAME, () => refreshLocked(staleRefreshToken)).finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  deps.watchExternalChanges?.(notify);

  return {
    getSession: read,

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    start(result: LoginResultDto, email: string) {
      write(fromLoginResult(result, email));
    },

    clear() {
      write(null);
    },

    /** Renova já, ex. para ler o `emailVerified` atual depois de verificar o email. */
    async refreshNow(): Promise<Session | null> {
      const session = read();
      return session ? refresh(session.refreshToken) : null;
    },

    /** Access token válido, renovado antes de expirar; `null` sem sessão. */
    async getAccessToken(): Promise<string | null> {
      const session = read();
      if (!session) return null;
      if (Date.parse(session.accessTokenExpiresAt) - now() > ACCESS_TOKEN_MARGIN_MS) {
        return session.accessToken;
      }
      return (await refresh(session.refreshToken))?.accessToken ?? null;
    },

    /** A Api recusou `rejectedAccessToken` com 401: renova, a não ser que já haja outro. */
    async renewAfterRejection(rejectedAccessToken: string): Promise<Session | null> {
      const session = read();
      if (!session) return null;
      if (session.accessToken !== rejectedAccessToken) return session;
      return refresh(session.refreshToken);
    },
  };
}

function fromLoginResult(result: LoginResultDto, email: string): Session {
  return {
    userId: result.userId,
    email,
    accessToken: result.token,
    accessTokenExpiresAt: result.accessTokenExpiresAt,
    refreshToken: result.refreshToken,
    refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    emailVerified: result.emailVerified,
  };
}

function parse(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session>;
    return value.accessToken && value.refreshToken ? (value as Session) : null;
  } catch {
    return null;
  }
}
