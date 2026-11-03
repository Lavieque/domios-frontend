import { describe, expect, it } from "vitest";
import { withoutNamePrefix } from "./templates";

describe("withoutNamePrefix", () => {
  it("drops the template name repeated at the start", () => {
    expect(withoutNamePrefix("Mês Rápido: ao almoço um prato principal.", "Mês Rápido")).toBe("Ao almoço um prato principal.");
  });

  it("keeps descriptions that do not start with the name", () => {
    expect(withoutNamePrefix("Ao almoço um prato principal.", "Mês Rápido")).toBe("Ao almoço um prato principal.");
  });

  it("keeps the description when only the name is there", () => {
    expect(withoutNamePrefix("Mês Rápido:", "Mês Rápido")).toBe("Mês Rápido:");
  });
});
