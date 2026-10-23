import { logoutAll } from "../api/account";
import { login, logout } from "../api/auth";
import { sessionStore } from "./sessionStore";

export async function signIn(email: string, password: string): Promise<void> {
  const normalizedEmail = email.trim();
  const result = await login(normalizedEmail, password);
  sessionStore.start(result, normalizedEmail);
}

/** Sai já neste browser; a Api termina a sessão em segundo plano (204 sempre). */
export async function signOut(): Promise<void> {
  const session = sessionStore.getSession();
  sessionStore.clear();
  if (session) {
    await logout(session.refreshToken).catch(() => undefined);
  }
}

export async function signOutEverywhere(): Promise<void> {
  await logoutAll();
  sessionStore.clear();
}
