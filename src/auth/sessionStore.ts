import { refresh } from "../api/auth";
import { createAuthedRequest } from "../api/authed";
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
