import { useEffect, useSyncExternalStore } from "react";
import { deleteAvatar, getAvatar, putAvatar } from "../api/avatar";
import { ApiError } from "../api/http";
import { useSession } from "./useSession";

// Um só avatar em memória, o do utilizador com sessão, partilhado pela barra e pela
// página da conta: pede-se uma vez, e trocar ou remover atualiza os dois.

interface AvatarState {
  userId: string | null;
  url: string | null;
  /** true quando já se sabe a resposta (há ou não há avatar); um erro deixa-o false para tentar de novo. */
  known: boolean;
}

let state: AvatarState = { userId: null, url: null, known: false };
/** Sobe a cada mudança: uma resposta de um pedido antigo não pisa uma gravação ou remoção mais recente. */
let version = 0;
const listeners = new Set<() => void>();

function setState(next: AvatarState) {
  if (state.url && state.url !== next.url) URL.revokeObjectURL(state.url);
  state = next;
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let loading: string | null = null;

/** Exportada para os testes; os componentes usam useAvatar. */
export async function loadAvatar(userId: string) {
  if (loading === userId) return;
  loading = userId;
  if (state.userId !== userId) setState({ userId, url: null, known: false });
  const started = version;
  try {
    const blob = await getAvatar();
    if (version === started) setState({ userId, url: URL.createObjectURL(blob), known: true });
  } catch (error) {
    // 404 é "sem avatar". Noutros erros fica a inicial e tenta-se de novo na próxima montagem.
    if (version === started && error instanceof ApiError && error.status === 404) {
      setState({ userId, url: null, known: true });
    }
  } finally {
    if (loading === userId) loading = null;
  }
}

/** O estado atual, para os testes. */
export function avatarSnapshot(): Readonly<AvatarState> {
  return state;
}

/** URL blob: do avatar do utilizador com sessão, ou null (sem avatar, a carregar ou sem sessão). */
export function useAvatar(): string | null {
  const session = useSession();
  const userId = session?.userId ?? null;
  const current = useSyncExternalStore(subscribe, () => state);

  useEffect(() => {
    if (userId === null) {
      if (state.userId !== null) setState({ userId: null, url: null, known: false });
    } else if (state.userId !== userId || !state.known) {
      void loadAvatar(userId);
    }
  }, [userId]);

  return current.userId === userId ? current.url : null;
}

/** Envia a imagem já preparada e passa a mostrá-la logo. */
export async function saveAvatar(userId: string, image: Blob): Promise<void> {
  await putAvatar(image);
  setState({ userId, url: URL.createObjectURL(image), known: true });
}

export async function removeAvatar(userId: string): Promise<void> {
  await deleteAvatar();
  setState({ userId, url: null, known: true });
}
