import { describe, expect, it } from "vitest";
import { safeNextPath, tokenFromHash } from "./links";

describe("links", () => {
  it("lê o token do fragmento", () => {
    expect(tokenFromHash("#token=Xb9k-_abc")).toBe("Xb9k-_abc");
    expect(tokenFromHash("")).toBeNull();
  });

  it("só aceita caminhos deste site como destino depois do login", () => {
    expect(safeNextPath("/produtos?search=leite")).toBe("/produtos?search=leite");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});
