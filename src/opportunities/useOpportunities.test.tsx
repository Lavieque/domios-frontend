// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpportunityListDto } from "../api/opportunities";

const listOpportunities = vi.fn<(householdId: string) => Promise<OpportunityListDto>>();
const getOpportunitySummary = vi.fn<(householdId: string) => Promise<{ headline: string }>>();
vi.mock("../api/opportunities", () => ({
  listOpportunities: (householdId: string) => listOpportunities(householdId),
  getOpportunitySummary: (householdId: string) => getOpportunitySummary(householdId),
}));

const { useOpportunities } = await import("./useOpportunities");

const flush = () => act(async () => undefined);
/** Só os campos que o hook lê; o resto do DTO não interessa aqui. */
const listOf = (...ids: string[]) => ({ items: ids.map((opportunityId) => ({ opportunityId })) }) as unknown as OpportunityListDto;
const ids = (list: OpportunityListDto | null) => list?.items.map((o) => o.opportunityId);

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// A cópia guardada é por casa e dura a sessão: cada teste usa a sua casa.
describe("useOpportunities", () => {
  it("lê as sugestões e só depois pede a síntese", async () => {
    let resolve!: (list: OpportunityListDto) => void;
    listOpportunities.mockReturnValue(new Promise((r) => (resolve = r)));
    getOpportunitySummary.mockResolvedValue({ headline: "2 ações" });
    const { result } = renderHook(() => useOpportunities("h-1"));
    await flush();
    expect(getOpportunitySummary).not.toHaveBeenCalled();
    resolve(listOf("a", "b"));
    await flush();
    expect(ids(result.current.opportunities)).toEqual(["a", "b"]);
    expect(result.current.headline).toBe("2 ações");
  });

  it("a mesma casa noutra página não volta a pedir as sugestões", async () => {
    listOpportunities.mockResolvedValue(listOf("a"));
    getOpportunitySummary.mockResolvedValue({ headline: "1 ação" });
    renderHook(() => useOpportunities("h-2"));
    await flush();
    cleanup();
    const { result } = renderHook(() => useOpportunities("h-2"));
    await flush();
    expect(listOpportunities).toHaveBeenCalledTimes(1);
    expect(ids(result.current.opportunities)).toEqual(["a"]);
  });

  it("fechar uma sugestão tira-a do ecrã e volta a pedir a síntese", async () => {
    listOpportunities.mockResolvedValue(listOf("a", "b"));
    getOpportunitySummary.mockResolvedValueOnce({ headline: "2 ações" }).mockResolvedValueOnce({ headline: "1 ação" });
    const { result } = renderHook(() => useOpportunities("h-3"));
    await flush();
    act(() => result.current.remove("a"));
    await flush();
    expect(ids(result.current.opportunities)).toEqual(["b"]);
    expect(result.current.headline).toBe("1 ação");
  });

  it("com keepVisible, fica no ecrã mas não volta na próxima visita", async () => {
    listOpportunities.mockResolvedValue(listOf("a", "b"));
    getOpportunitySummary.mockResolvedValue({ headline: "" });
    const { result } = renderHook(() => useOpportunities("h-4"));
    await flush();
    act(() => result.current.remove("a", true));
    await flush();
    expect(ids(result.current.opportunities)).toEqual(["a", "b"]);
    cleanup();
    const again = renderHook(() => useOpportunities("h-4"));
    await flush();
    expect(ids(again.result.current.opportunities)).toEqual(["b"]);
  });

  it("uma falha não fica guardada: a visita seguinte tenta outra vez", async () => {
    listOpportunities.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(listOf("a"));
    getOpportunitySummary.mockResolvedValue({ headline: "" });
    const { result } = renderHook(() => useOpportunities("h-5"));
    await flush();
    expect(result.current.opportunities).toBeNull();
    cleanup();
    const again = renderHook(() => useOpportunities("h-5"));
    await flush();
    expect(ids(again.result.current.opportunities)).toEqual(["a"]);
  });
});
