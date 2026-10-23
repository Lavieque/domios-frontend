import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionStore } from "../auth/session";
import type { LoginResultDto } from "./auth";
import { createAuthedRequest } from "./authed";
import { ApiError } from "./http";

const NOW = Date.now();

function loginResult(n: number): LoginResultDto {
  return {
    userId: "user-1",
    token: `access-${n}`,
    accessTokenExpiresAt: new Date(NOW + 15 * 60_000).toISOString(),
    refreshToken: `refresh-${n}`,
    refreshTokenExpiresAt: new Date(NOW + 30 * 24 * 3_600_000).toISOString(),
    emailVerified: true,
  };
}

function setup() {
  const values = new Map<string, string>();
  const store = createSessionStore({
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: (key) => void values.delete(key),
    },
    refreshRequest: vi.fn(async () => loginResult(2)),
  });
  return { store, request: createAuthedRequest(store) };
}

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function authorizationOf(call: unknown[]): string | undefined {
  return ((call[1] as RequestInit).headers as Record<string, string>)["Authorization"];
}

afterEach(() => vi.unstubAllGlobals());

describe("authed request", () => {
  it("envia o access token no cabeçalho Authorization", async () => {
    const { store, request } = setup();
    store.start(loginResult(1), "ana@example.com");
    const fetchMock = vi.fn(async () => respond(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await request("/households/h1")).toEqual({ ok: true });
    expect(authorizationOf(fetchMock.mock.calls[0])).toBe("Bearer access-1");
  });

  it("depois de um 401 renova a sessão e repete o pedido uma vez", async () => {
    const { store, request } = setup();
    store.start(loginResult(1), "ana@example.com");
    const fetchMock = vi.fn().mockResolvedValueOnce(respond(401)).mockResolvedValueOnce(respond(204));
    vi.stubGlobal("fetch", fetchMock);

    await request("/auth/logout-all", { method: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authorizationOf(fetchMock.mock.calls[1])).toBe("Bearer access-2");
  });

  it("sem sessão lança 401 sem chamar a Api", async () => {
    const { request } = setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/households/h1")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lê o type do Problem Details e o Retry-After", async () => {
    const { store, request } = setup();
    store.start(loginResult(1), "ana@example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ type: "too-many-requests" }), { status: 429, headers: { "Retry-After": "42" } })),
    );

    const error = await request("/households/h1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, type: "too-many-requests", retryAfterSeconds: 42 });
  });
});
