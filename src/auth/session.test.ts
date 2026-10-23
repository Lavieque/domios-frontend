import { describe, expect, it, vi } from "vitest";
import type { LoginResultDto } from "../api/auth";
import { ApiError } from "../api/http";
import { createSessionStore, SESSION_STORAGE_KEY, type SessionStoreDeps } from "./session";

const NOW = Date.parse("2026-10-23T10:00:00Z");

function loginResult(n: number, accessExpiresInMs = 15 * 60_000): LoginResultDto {
  return {
    userId: "user-1",
    token: `access-${n}`,
    accessTokenExpiresAt: new Date(NOW + accessExpiresInMs).toISOString(),
    refreshToken: `refresh-${n}`,
    refreshTokenExpiresAt: new Date(NOW + 30 * 24 * 3_600_000).toISOString(),
    emailVerified: false,
  };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

/** Um Web Lock a sério: tarefas com o mesmo nome correm uma de cada vez, partilhado entre "separadores". */
function sharedLock() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T,>(_name: string, task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task);
    tail = run.catch(() => undefined);
    return run;
  };
}

function setup(overrides: Partial<SessionStoreDeps> = {}) {
  const storage = overrides.storage ?? memoryStorage();
  let issued = 1;
  const refreshRequest = vi.fn(async (_token: string) => loginResult(++issued));
  const store = createSessionStore({ storage, refreshRequest, now: () => NOW, ...overrides });
  return { store, storage, refreshRequest };
}

describe("session store", () => {
  it("guarda a sessão do login e devolve o access token enquanto é válido", async () => {
    const { store, storage, refreshRequest } = setup();
    store.start(loginResult(1), "ana@example.com");

    expect(await store.getAccessToken()).toBe("access-1");
    expect(store.getSession()?.email).toBe("ana@example.com");
    expect(JSON.parse(storage.getItem(SESSION_STORAGE_KEY)!).refreshToken).toBe("refresh-1");
    expect(refreshRequest).not.toHaveBeenCalled();
  });

  it("renova antes de expirar e guarda o refresh token novo", async () => {
    const { store, refreshRequest } = setup();
    store.start(loginResult(1, 30_000), "ana@example.com");

    expect(await store.getAccessToken()).toBe("access-2");
    expect(refreshRequest).toHaveBeenCalledWith("refresh-1");
    expect(store.getSession()?.refreshToken).toBe("refresh-2");
    expect(store.getSession()?.email).toBe("ana@example.com");
  });

  it("faz um só refresh para pedidos simultâneos no mesmo separador", async () => {
    const { store, refreshRequest } = setup();
    store.start(loginResult(1, 0), "ana@example.com");

    const tokens = await Promise.all([store.getAccessToken(), store.getAccessToken(), store.getAccessToken()]);

    expect(tokens).toEqual(["access-2", "access-2", "access-2"]);
    expect(refreshRequest).toHaveBeenCalledTimes(1);
  });

  it("não gasta o refresh token que outro separador já rodou", async () => {
    const storage = memoryStorage();
    const lock = sharedLock();
    const tabA = setup({ storage, lock });
    const tabB = setup({ storage, lock });
    tabA.store.start(loginResult(1, 0), "ana@example.com");

    const [tokenA, tokenB] = await Promise.all([tabA.store.getAccessToken(), tabB.store.getAccessToken()]);

    expect(tabA.refreshRequest.mock.calls.length + tabB.refreshRequest.mock.calls.length).toBe(1);
    expect(tokenA).toBe(tokenB);
  });

  it("termina a sessão quando a Api recusa o refresh token", async () => {
    const { store } = setup({
      refreshRequest: vi.fn(async () => {
        throw new ApiError(401, "invalid-refresh-token", "401", null);
      }),
    });
    store.start(loginResult(1, 0), "ana@example.com");

    expect(await store.getAccessToken()).toBeNull();
    expect(store.getSession()).toBeNull();
  });

  it("mantém a sessão se o refresh falhar por outro motivo (ex. rede)", async () => {
    const { store } = setup({
      refreshRequest: vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });
    store.start(loginResult(1, 0), "ana@example.com");

    await expect(store.getAccessToken()).rejects.toThrow("Failed to fetch");
    expect(store.getSession()?.refreshToken).toBe("refresh-1");
  });

  it("não ressuscita a sessão se o utilizador sair durante o refresh", async () => {
    let finish!: (result: LoginResultDto) => void;
    const { store } = setup({ refreshRequest: () => new Promise((resolve) => (finish = resolve)) });
    store.start(loginResult(1, 0), "ana@example.com");

    const pending = store.getAccessToken();
    store.clear();
    finish(loginResult(2));

    expect(await pending).toBeNull();
    expect(store.getSession()).toBeNull();
  });

  it("depois de um 401, só renova se o token recusado ainda for o atual", async () => {
    const { store, refreshRequest } = setup();
    store.start(loginResult(1), "ana@example.com");

    const renewed = await store.renewAfterRejection("access-1");
    expect(renewed?.accessToken).toBe("access-2");

    const again = await store.renewAfterRejection("access-1");
    expect(again?.accessToken).toBe("access-2");
    expect(refreshRequest).toHaveBeenCalledTimes(1);
  });

  it("avisa os subscritores e mantém o mesmo objeto enquanto nada muda", () => {
    const { store } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    store.start(loginResult(1), "ana@example.com");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSession()).toBe(store.getSession());

    store.clear();
    expect(store.getSession()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
