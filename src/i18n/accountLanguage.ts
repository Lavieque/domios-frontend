// A língua guardada na conta manda: depois de entrar (ou ao abrir a app já com
// sessão) lê-se das preferências e aplica-se neste browser. Mudar a língua na
// página da conta grava primeiro na Api e só depois muda a app.

import { getPreferences, updatePreferences } from "../api/account";
import { sessionStore } from "../auth/sessionStore";
import { isLang, setLanguage, type Lang } from "./language";

let syncedUserId: string | null = null;

function syncFromAccount() {
  const userId = sessionStore.getSession()?.userId ?? null;
  if (userId === syncedUserId) return;
  syncedUserId = userId;
  if (!userId) return;
  getPreferences()
    .then((preferences) => {
      // Só se a sessão ainda for a mesma quando a resposta chega.
      if (sessionStore.getSession()?.userId === userId && isLang(preferences.language)) setLanguage(preferences.language);
    })
    // Api antiga sem a rota, ou sem rede: fica a língua deste browser.
    .catch(() => undefined);
}

/** Chamar uma vez, no arranque. */
export function startAccountLanguageSync(): void {
  sessionStore.subscribe(syncFromAccount);
  syncFromAccount();
}

/** Grava a língua na conta e muda a app. Lança o erro da Api se não gravar. */
export async function saveAccountLanguage(lang: Lang): Promise<void> {
  const saved = await updatePreferences({ language: lang });
  setLanguage(isLang(saved.language) ? saved.language : lang);
}
