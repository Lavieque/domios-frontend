import { afterEach, describe, expect, it, vi } from "vitest";

const authedRequest = vi.fn();
vi.mock("../auth/sessionStore", () => ({ authedRequest: (...args: unknown[]) => authedRequest(...args) }));

const { listAllCookedRecipes } = await import("./savedRecipes");

const item = (n: number) => ({ recipeId: `r-${n}`, title: `R ${n}`, imageUrl: null, timesCooked: 1, lastCookedAt: "2026-11-01T20:00:00Z", isSaved: false, isReadable: true });

function servePages(total: number) {
  authedRequest.mockImplementation(async (_path: string, init: { params: { page: number; pageSize: number } }) => {
    const { page, pageSize } = init.params;
    const from = (page - 1) * pageSize;
    const items = Array.from({ length: Math.max(0, Math.min(pageSize, total - from)) }, (_, i) => item(from + i));
    return { items, total, page, pageSize };
  });
}

afterEach(() => authedRequest.mockReset());

describe("listAllCookedRecipes", () => {
  it("com poucas receitas, faz um só pedido", async () => {
    servePages(7);
    const all = await listAllCookedRecipes("h-1");
    expect(all).toHaveLength(7);
    expect(authedRequest).toHaveBeenCalledTimes(1);
    expect(authedRequest.mock.calls[0][0]).toBe("/households/h-1/recipes/cooked");
  });

  it("junta todas as páginas, de 100 em 100", async () => {
    servePages(250);
    const all = await listAllCookedRecipes("h-1");
    expect(all).toHaveLength(250);
    expect(new Set(all.map((r) => r.recipeId)).size).toBe(250);
    expect(authedRequest.mock.calls.map((c) => c[1].params.page)).toEqual([1, 2, 3]);
  });

  it("para nas 10 páginas, mesmo com um histórico maior", async () => {
    servePages(5000);
    const all = await listAllCookedRecipes("h-1");
    expect(all).toHaveLength(1000);
    expect(authedRequest).toHaveBeenCalledTimes(10);
  });

  it("sem receitas feitas, devolve vazio", async () => {
    servePages(0);
    expect(await listAllCookedRecipes("h-1")).toEqual([]);
    expect(authedRequest).toHaveBeenCalledTimes(1);
  });
});
