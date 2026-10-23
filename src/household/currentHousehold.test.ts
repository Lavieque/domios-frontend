import { describe, expect, it } from "vitest";
import { pickHouseholdId } from "./currentHousehold";

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
