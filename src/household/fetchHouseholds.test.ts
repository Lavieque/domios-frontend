import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listMyHouseholds = vi.fn();
vi.mock("../api/households", () => ({ listMyHouseholds: () => listMyHouseholds() }));

const { fetchHouseholds } = await import("./fetchHouseholds");
const { householdsChanged } = await import("./currentHousehold");

const casa = { householdId: "h-1", name: "Casa", memberId: "m-1", role: 0 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", {
    localStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
    dispatchEvent: () => true,
  });
  // Cada teste começa sem resposta guardada: mudar as casas invalida-a.
  householdsChanged("setup");
});

afterEach(() => {
  listMyHouseholds.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchHouseholds", () => {
  it("pedidos ao mesmo tempo partilham um só GET /households", async () => {
    let resolve!: (value: unknown) => void;
    listMyHouseholds.mockReturnValue(new Promise((r) => (resolve = r)));
    const all = Promise.all([fetchHouseholds("u1"), fetchHouseholds("u1"), fetchHouseholds("u1")]);
    resolve([casa]);
    const [a, b, c] = await all;
    expect(listMyHouseholds).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("uma resposta recente serve a quem montar a seguir, sem novo pedido", async () => {
    listMyHouseholds.mockResolvedValue([casa]);
    await fetchHouseholds("u1");
    vi.advanceTimersByTime(29_000);
    expect(await fetchHouseholds("u1")).toEqual([casa]);
    expect(listMyHouseholds).toHaveBeenCalledTimes(1);
  });

  it("passados 30 segundos, pergunta outra vez", async () => {
    listMyHouseholds.mockResolvedValue([casa]);
    await fetchHouseholds("u1");
    vi.advanceTimersByTime(31_000);
    await fetchHouseholds("u1");
    expect(listMyHouseholds).toHaveBeenCalledTimes(2);
  });

  it("depois de mudar as casas, a resposta guardada já não serve", async () => {
    listMyHouseholds.mockResolvedValueOnce([]).mockResolvedValueOnce([casa]);
    expect(await fetchHouseholds("u1")).toEqual([]);
    householdsChanged("u1");
    expect(await fetchHouseholds("u1")).toEqual([casa]);
    expect(listMyHouseholds).toHaveBeenCalledTimes(2);
  });

  it("depois de mudar as casas, um pedido que já ia a meio também não serve", async () => {
    let resolveOld!: (value: unknown) => void;
    listMyHouseholds.mockReturnValueOnce(new Promise((r) => (resolveOld = r))).mockResolvedValueOnce([casa]);
    const before = fetchHouseholds("u1");
    householdsChanged("u1");
    expect(await fetchHouseholds("u1")).toEqual([casa]);
    expect(listMyHouseholds).toHaveBeenCalledTimes(2);
    resolveOld([]);
    expect(await before).toEqual([]);
  });

  it("outro utilizador não recebe a lista do anterior", async () => {
    listMyHouseholds.mockResolvedValueOnce([casa]).mockResolvedValueOnce([]);
    await fetchHouseholds("u1");
    expect(await fetchHouseholds("u2")).toEqual([]);
    expect(listMyHouseholds).toHaveBeenCalledTimes(2);
  });

  it("depois de falhar, o pedido seguinte volta a tentar", async () => {
    listMyHouseholds.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([]);
    await expect(fetchHouseholds("u1")).rejects.toThrow("offline");
    await expect(fetchHouseholds("u1")).resolves.toEqual([]);
    expect(listMyHouseholds).toHaveBeenCalledTimes(2);
  });
});
