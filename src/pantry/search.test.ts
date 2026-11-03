import { describe, expect, it } from "vitest";
import { matchesSearch } from "./search";

describe("matchesSearch", () => {
  it("ignores accents and case", () => {
    expect(matchesSearch("Maçã Gala", "maca")).toBe(true);
    expect(matchesSearch("leite", "LEITE")).toBe(true);
  });

  it("requires every word, in any order", () => {
    expect(matchesSearch("Leite Meio Gordo Mimosa", "gordo leite")).toBe(true);
    expect(matchesSearch("Leite Meio Gordo", "leite magro")).toBe(false);
  });

  it("accepts everything for an empty query", () => {
    expect(matchesSearch("Arroz", "   ")).toBe(true);
  });
});
