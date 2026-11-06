import { describe, expect, it } from "vitest";
import { searchTerms } from "./CatalogSuggestions";

describe("searchTerms", () => {
  it("tries the text and its singular, never just the first word", () => {
    expect(searchTerms("Pimentos")).toEqual(["Pimentos", "Pimento"]);
    expect(searchTerms("Bolachas Maria")).toEqual(["Bolachas Maria", "Bolacha Maria"]);
    expect(searchTerms("Massa de tomate")).not.toContain("Massa");
  });

  it("drops one-letter terms", () => {
    expect(searchTerms("a")).toEqual([]);
  });
});
