import { describe, expect, it } from "vitest";
import { searchTerms } from "./CatalogSuggestions";

describe("searchTerms", () => {
  it("tries the text, its singular and the first word", () => {
    expect(searchTerms("Pimentos")).toEqual(["Pimentos", "Pimento"]);
    expect(searchTerms("Bolachas Maria")).toEqual(["Bolachas Maria", "Bolacha Maria", "Bolachas"]);
  });

  it("drops one-letter terms", () => {
    expect(searchTerms("a")).toEqual([]);
  });
});
