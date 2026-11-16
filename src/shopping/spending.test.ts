import { describe, expect, it } from "vitest";
import { monthLabel, periodFor } from "./spending";

describe("periodFor", () => {
  it("starts on the first day of the oldest month and ends today", () => {
    expect(periodFor(6, new Date(2026, 10, 12))).toEqual({ from: "2026-06-01", to: "2026-11-12" });
  });

  it("crosses the year", () => {
    expect(periodFor(3, new Date(2027, 0, 5))).toEqual({ from: "2026-11-01", to: "2027-01-05" });
  });
});

describe("monthLabel", () => {
  it("names the month in Portuguese", () => {
    expect(monthLabel("2026-11")).toBe("novembro de 2026");
  });
});
