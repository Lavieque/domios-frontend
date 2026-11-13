import { afterEach, describe, expect, it, vi } from "vitest";
import { CATALOG_TTL_MS, HOUSEHOLD_TTL_MS, setCacheClock } from "./cache";
import { send } from "./http";

let clock = 0;
setCacheClock(() => clock);

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function stubFetch(...bodies: unknown[]) {
  const fetchMock = vi.fn();
  for (const body of bodies) fetchMock.mockImplementationOnce(async () => respond(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  clock = 0;
});

describe("cache de pedidos GET", () => {
  it("devolve a mesma resposta sem voltar à Api", async () => {
    const fetchMock = stubFetch({ name: "Leite" });

    expect(await send("/products/p1")).toEqual({ name: "Leite" });
    expect(await send("/products/p1")).toEqual({ name: "Leite" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("partilha o pedido entre chamadas simultâneas", async () => {
    const fetchMock = stubFetch({ name: "Leite" });

    const [a, b] = await Promise.all([send("/products/p1"), send("/products/p1")]);
    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cada leitura recebe uma cópia própria", async () => {
    stubFetch([3, 1, 2]);

    const first = await send<number[]>("/products");
    first.sort();
    expect(await send("/products")).toEqual([3, 1, 2]);
  });

  it("parâmetros diferentes são pedidos diferentes", async () => {
    const fetchMock = stubFetch({ page: 1 }, { page: 2 });

    await send("/products", { params: { page: 1 } });
    expect(await send("/products", { params: { page: 2 } })).toEqual({ page: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("o catálogo expira ao fim de CATALOG_TTL_MS", async () => {
    const fetchMock = stubFetch({ v: 1 }, { v: 2 });

    await send("/products/p1");
    clock += CATALOG_TTL_MS - 1;
    expect(await send("/products/p1")).toEqual({ v: 1 });
    clock += 1;
    expect(await send("/products/p1")).toEqual({ v: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("os dados da casa expiram ao fim de HOUSEHOLD_TTL_MS", async () => {
    const fetchMock = stubFetch({ v: 1 }, { v: 2 });

    await send("/households/h1", { accessToken: "t1" });
    clock += HOUSEHOLD_TTL_MS;
    expect(await send("/households/h1", { accessToken: "t2" })).toEqual({ v: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uma escrita limpa a cache", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => respond({ v: 1 }))
      .mockImplementationOnce(async () => new Response(null, { status: 204 }))
      .mockImplementationOnce(async () => respond({ v: 2 }));
    vi.stubGlobal("fetch", fetchMock);

    await send("/households/h1/pantry", { accessToken: "t" });
    await send("/households/h1/pantry", { method: "POST", body: {}, accessToken: "t" });
    expect(await send("/households/h1/pantry", { accessToken: "t" })).toEqual({ v: 2 });
  });

  it("um erro não fica em cache", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => respond({ type: "boom" }, 500))
      .mockImplementationOnce(async () => respond({ v: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(send("/products/p1")).rejects.toMatchObject({ status: 500, type: "boom" });
    expect(await send("/products/p1")).toEqual({ v: 1 });
  });
});
