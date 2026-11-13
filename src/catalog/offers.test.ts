import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadOffers, resetOffersCache } from "./offers";

function offer(storeOfferId: string) {
  return { storeOfferId, storeName: `Loja ${storeOfferId}`, latestPrice: null };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => resetOffersCache());
afterEach(() => vi.unstubAllGlobals());

describe("loadOffers", () => {
  it("junta os produtos pedidos no mesmo tick num só pedido", async () => {
    const fetchMock = vi.fn(async () => json({ a: [offer("o1")], b: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const [a, b, c] = await Promise.all([loadOffers("a"), loadOffers("b"), loadOffers("c")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain("/products/batch/store-offers?ids=a%2Cb%2Cc");
    expect(a?.map((o) => o.storeOfferId)).toEqual(["o1"]);
    expect(b).toEqual([]);
    expect(c).toEqual([]);
  });

  it("não volta a pedir um produto que já tem", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => json({ a: [] }))
      .mockImplementationOnce(async () => json({ b: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await loadOffers("a");
    await Promise.all([loadOffers("a"), loadOffers("b")]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("ids=b");
  });

  it("sem o pedido em lote (404), pede produto a produto", async () => {
    const fetchMock = vi.fn(async (url: URL) =>
      url.pathname.endsWith("/batch/store-offers")
        ? json({ type: "not-found" }, 404)
        : json([offer(url.pathname.split("/").at(-2)!)]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([loadOffers("a"), loadOffers("b")]);

    expect(a?.[0].storeOfferId).toBe("a");
    expect(b?.[0].storeOfferId).toBe("b");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("uma falha não fica em cache", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => json({ type: "boom" }, 500))
      .mockImplementationOnce(async () => json({ type: "boom" }, 500))
      .mockImplementationOnce(async () => json({ a: [offer("o1")] }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await loadOffers("a")).toBeNull();
    expect(await loadOffers("a")).toEqual([offer("o1")]);
  });
});
