import { afterEach, describe, expect, it, vi } from "vitest";
import { forgetStoredHouseholds, getStoredHouseholds, pickHouseholdId, storeHouseholds } from "./currentHousehold";

function stubStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    },
  });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe("pickHouseholdId", () => {
  it("mantém a casa guardada se o utilizador ainda for membro", () => {
    expect(pickHouseholdId(["a", "b"], "b")).toBe("b");
  });

  it("cai na primeira casa se a guardada já não for dele (saiu ou foi removido)", () => {
    expect(pickHouseholdId(["a", "b"], "c")).toBe("a");
    expect(pickHouseholdId(["a", "b"], null)).toBe("a");
  });

  it("sem casas, não há casa atual", () => {
    expect(pickHouseholdId([], "a")).toBeNull();
  });
});

describe("lista de casas guardada", () => {
  const casa = { householdId: "h1", name: "Casa", memberId: "m1", role: 0 } as const;

  it("guarda e lê a lista por utilizador", () => {
    stubStorage();
    storeHouseholds("u1", [casa]);
    expect(getStoredHouseholds("u1")).toEqual([casa]);
    expect(getStoredHouseholds("u2")).toBeNull();
  });

  it("ignora o que não tem o formato esperado", () => {
    const values = stubStorage();
    values.set("domios.households.u1", "{nope");
    expect(getStoredHouseholds("u1")).toBeNull();
    values.set("domios.households.u1", JSON.stringify([{ name: "sem id" }]));
    expect(getStoredHouseholds("u1")).toBeNull();
  });

  it("esquece a lista ao sair da sessão", () => {
    stubStorage();
    storeHouseholds("u1", [casa]);
    forgetStoredHouseholds("u1");
    expect(getStoredHouseholds("u1")).toBeNull();
  });
});
