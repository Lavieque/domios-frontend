import { refresh } from "../api/auth";
import { createAuthedRequest } from "../api/authed";
import { clearApiCache } from "../api/cache";
import { forgetStoredHouseholds } from "../household/currentHousehold";
import { createSessionStore, SESSION_STORAGE_KEY } from "./session";

export const sessionStore = createSessionStore({
  storage: window.localStorage,
  refreshRequest: refresh,
  lock: navigator.locks ? (name, task) => navigator.locks.request(name, task) : undefined,
  watchExternalChanges: (onChange) => {
    window.addEventListener("storage", (event) => {
      if (event.key === SESSION_STORAGE_KEY || event.key === null) onChange();
    });
  },
});

export const authedRequest = createAuthedRequest(sessionStore);

// Entrar, sair ou trocar de utilizador (também noutro separador) limpa a cache
// de respostas, para nunca mostrar os dados da casa de outra sessão.
let cachedUserId = sessionStore.getSession()?.userId ?? null;
sessionStore.subscribe(() => {
  const userId = sessionStore.getSession()?.userId ?? null;
  if (userId !== cachedUserId) {
    if (cachedUserId && userId === null) forgetStoredHouseholds(cachedUserId);
    cachedUserId = userId;
    clearApiCache();
  }
});
