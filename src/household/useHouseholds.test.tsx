// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CallerHouseholdDto } from "../api/households";

const fetchHouseholds = vi.fn<(userId: string) => Promise<CallerHouseholdDto[]>>();
vi.mock("./fetchHouseholds", () => ({ fetchHouseholds: (userId: string) => fetchHouseholds(userId) }));
let session: { userId: string } | null = { userId: "u1" };
vi.mock("../auth/useSession", () => ({ useSession: () => session }));

const { useHouseholds } = await import("./useHouseholds");
const { householdsChanged, storeHouseholds, storeHouseholdId } = await import("./currentHousehold");

const casa: CallerHouseholdDto = { householdId: "h-1", name: "Casa", memberId: "m-1", role: 0 };
const praia: CallerHouseholdDto = { householdId: "h-2", name: "Praia", memberId: "m-2", role: 0 };
const flush = () => act(async () => undefined);

beforeEach(() => {
  window.localStorage.clear();
  session = { userId: "u1" };
});
afterEach(() => {
  cleanup();
  fetchHouseholds.mockReset();
});

describe("useHouseholds", () => {
  it("sem lista guardada, mostra o esqueleto até a lista chegar", async () => {
    fetchHouseholds.mockResolvedValue([casa]);
    const { result } = renderHook(() => useHouseholds());
    expect(result.current.loading).toBe(true);
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.current?.householdId).toBe("h-1");
  });

  it("com a lista guardada, arranca já com ela e a casa escolhida", () => {
    storeHouseholds("u1", [casa, praia]);
    storeHouseholdId("u1", "h-2");
    fetchHouseholds.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useHouseholds());
    expect(result.current.loading).toBe(false);
    expect(result.current.current?.name).toBe("Praia");
  });

  it("ao mudar as casas, volta a pedir sem voltar ao esqueleto", async () => {
    fetchHouseholds.mockResolvedValueOnce([casa]);
    const { result } = renderHook(() => useHouseholds());
    await flush();
    let resolve!: (value: CallerHouseholdDto[]) => void;
    fetchHouseholds.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    act(() => householdsChanged("u1"));
    expect(result.current.loading).toBe(false);
    expect(result.current.households).toEqual([casa]);
    resolve([casa, praia]);
    await flush();
    expect(result.current.households).toEqual([casa, praia]);
  });

  it("uma falha ao revalidar não tapa a lista que já está no ecrã", async () => {
    fetchHouseholds.mockResolvedValueOnce([casa]);
    const { result } = renderHook(() => useHouseholds());
    await flush();
    fetchHouseholds.mockRejectedValueOnce(new Error("offline"));
    act(() => result.current.reload());
    await flush();
    expect(result.current.error).toBeNull();
    expect(result.current.households).toEqual([casa]);
  });

  it("sem nada no ecrã, a falha aparece", async () => {
    fetchHouseholds.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useHouseholds());
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it("outro utilizador não vê as casas do anterior", async () => {
    storeHouseholds("u1", [casa]);
    fetchHouseholds.mockReturnValue(new Promise(() => undefined));
    const { result, rerender } = renderHook(() => useHouseholds());
    expect(result.current.households).toEqual([casa]);
    session = { userId: "u2" };
    rerender();
    expect(result.current.households).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("escolher outra casa guarda-a neste browser", async () => {
    fetchHouseholds.mockResolvedValue([casa, praia]);
    const { result } = renderHook(() => useHouseholds());
    await flush();
    act(() => result.current.select("h-2"));
    expect(result.current.current?.householdId).toBe("h-2");
    expect(window.localStorage.getItem("domios.household.u1")).toBe("h-2");
  });
});
