// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLoad } from "./useLoad";

/** Uma promessa que o teste resolve ou rejeita quando quiser. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => act(async () => undefined);

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useLoad", () => {
  it("começa a carregar e mostra a resposta da chave", async () => {
    const answer = deferred<string>();
    const { result } = renderHook(() => useLoad(["a"], () => answer.promise));
    expect(result.current).toMatchObject({ data: null, loading: true, error: null });
    answer.resolve("A");
    await flush();
    expect(result.current).toMatchObject({ data: "A", loading: false });
  });

  it("sem chave não pede nada nem fica a carregar", () => {
    const load = vi.fn(() => Promise.resolve(1));
    const { result } = renderHook(() => useLoad(null, load));
    expect(load).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("uma resposta de uma chave antiga não aparece na nova", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const { result, rerender } = renderHook(({ key }) => useLoad([key], () => (key === "a" ? first.promise : second.promise)), {
      initialProps: { key: "a" },
    });
    rerender({ key: "b" });
    first.resolve("A");
    await flush();
    expect(result.current).toMatchObject({ data: null, loading: true });
    second.resolve("B");
    await flush();
    expect(result.current.data).toBe("B");
  });

  it("com keepPrevious, a resposta anterior fica até chegar a nova", async () => {
    const answers: Record<string, ReturnType<typeof deferred<string>>> = { a: deferred(), b: deferred() };
    const { result, rerender } = renderHook(({ key }) => useLoad([key], () => answers[key].promise, { keepPrevious: true }), {
      initialProps: { key: "a" },
    });
    answers.a.resolve("A");
    await flush();
    rerender({ key: "b" });
    expect(result.current).toMatchObject({ data: "A", loading: true });
    answers.b.resolve("B");
    await flush();
    expect(result.current).toMatchObject({ data: "B", loading: false });
  });

  it("o erro chega em texto e tal como veio", async () => {
    const failure = new Error("boom");
    const { result } = renderHook(() => useLoad(["a"], () => Promise.reject(failure)));
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.failure).toBe(failure);
    expect(typeof result.current.error).toBe("string");
  });

  it("reload pede outra vez sem tirar os dados do ecrã", async () => {
    let n = 0;
    const { result } = renderHook(() => useLoad(["a"], () => Promise.resolve(++n)));
    await flush();
    expect(result.current.data).toBe(1);
    act(() => result.current.reload());
    expect(result.current).toMatchObject({ data: 1, loading: false });
    await flush();
    expect(result.current.data).toBe(2);
  });

  it("update muda os dados guardados sem novo pedido", async () => {
    const load = vi.fn(() => Promise.resolve([1, 2, 3]));
    const { result } = renderHook(() => useLoad(["a"], load));
    await flush();
    act(() => result.current.update((list) => list.filter((n) => n !== 2)));
    expect(result.current.data).toEqual([1, 3]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("com delay, só pede quando a chave pára de mudar", async () => {
    const load = vi.fn((term: string) => Promise.resolve(term));
    const { result, rerender } = renderHook(({ term }) => useLoad([term], () => load(term), { delay: 250 }), {
      initialProps: { term: "ar" },
    });
    rerender({ term: "arr" });
    rerender({ term: "arroz" });
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith("arroz");
    expect(result.current.data).toBe("arroz");
  });
});
