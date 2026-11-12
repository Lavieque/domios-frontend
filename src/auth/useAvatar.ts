import { useEffect, useSyncExternalStore } from "react";
import { deleteAvatar, getAvatar, putAvatar } from "../api/avatar";
import { useSession } from "./useSession";

// Um só avatar em memória, o do utilizador com sessão, partilhado pela barra e pela
// página da conta: pede-se uma vez, e trocar ou remover atualiza os dois.

interface AvatarState {
  userId: string | null;
  url: string | null;
}

let state: AvatarState = { userId: null, url: null };
const listeners = new Set<() => void>();

function setState(next: AvatarState) {
  if (state.url && state.url !== next.url) URL.revokeObjectURL(state.url);
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function load(userId: string) {
  setState({ userId, url: null });
  try {
    const blob = await getAvatar();
    if (state.userId === userId) setState({ userId, url: URL.createObjectURL(blob) });
  } catch {
    // 404 é "sem avatar"; noutros erros fica a inicial, que é o mesmo que o utilizador já via.
  }
}

/** URL blob: do avatar do utilizador com sessão, ou null (sem avatar, a carregar ou sem sessão). */
export function useAvatar(): string | null {
  const session = useSession();
  const userId = session?.userId ?? null;
  const current = useSyncExternalStore(subscribe, () => state);

  useEffect(() => {
    if (userId === null) {
      if (state.userId !== null) setState({ userId: null, url: null });
    } else if (state.userId !== userId) {
      void load(userId);
    }
  }, [userId]);

  return current.userId === userId ? current.url : null;
}

/** Envia a imagem já preparada e passa a mostrá-la logo. */
export async function saveAvatar(userId: string, image: Blob): Promise<void> {
  await putAvatar(image);
  setState({ userId, url: URL.createObjectURL(image) });
}

export async function removeAvatar(userId: string): Promise<void> {
  await deleteAvatar();
  setState({ userId, url: null });
}
