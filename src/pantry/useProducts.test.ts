import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProducts, resetProductsCache } from "./useProducts";

function product(id: string) {
  return { productId: id, name: `Produto ${id}` };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => resetProductsCache());
afterEach(() => vi.unstubAllGlobals());

describe("loadProducts", () => {
  it("pede todos os produtos num só pedido", async () => {
    const fetchMock = vi.fn(async () => json([product("b"), product("a")]));
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await loadProducts(["a", "b", "c"]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain("/products/batch?ids=a%2Cb%2Cc");
    expect(loaded.map((p) => p?.productId ?? null)).toEqual(["a", "b", null]);
  });

  it("não volta a pedir os que já tem", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => json([product("a")]))
      .mockImplementationOnce(async () => json([product("b")]));
    vi.stubGlobal("fetch", fetchMock);

    await loadProducts(["a"]);
    await loadProducts(["a", "b"]);

    expect(String(fetchMock.mock.calls[1][0])).toContain("ids=b");
  });

  it("sem o endpoint em lote (404), pede um a um", async () => {
    const fetchMock = vi.fn(async (url: URL) =>
      url.pathname.endsWith("/batch") ? json({ type: "not-found" }, 404) : json(product(url.pathname.split("/").pop()!)),
    );
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await loadProducts(["a", "b"]);

    expect(loaded.map((p) => p?.productId)).toEqual(["a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
