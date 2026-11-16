import { describe, expect, it } from "vitest";
import { loadEach } from "./recipeImages";

describe("loadEach", () => {
  it("loads each id once and never more than the limit at a time", async () => {
    let running = 0;
    let peak = 0;
    const calls: string[] = [];
    const results = new Map<string, string | null>();
    await loadEach(
      ["a", "b", "a", "c", "d", "e", "b"],
      async (id) => {
        calls.push(id);
        running++;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
        return `img-${id}`;
      },
      (id, value) => results.set(id, value),
      2,
    );
    expect(calls.sort()).toEqual(["a", "b", "c", "d", "e"]);
    expect(peak).toBe(2);
    expect(results.get("c")).toBe("img-c");
  });

  it("gives null for an id that fails and carries on", async () => {
    const results = new Map<string, string | null>();
    await loadEach(
      ["ok", "bad"],
      async (id) => {
        if (id === "bad") throw new Error("404");
        return "x";
      },
      (id, value) => results.set(id, value),
    );
    expect(results).toEqual(new Map([["ok", "x"], ["bad", null]]));
  });
});
