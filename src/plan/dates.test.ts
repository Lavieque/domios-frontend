import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isIsoDate, startOfWeek, today, weekDays } from "./dates";

describe("datas do plano", () => {
  it("a semana começa à segunda, também quando o dia é domingo", () => {
    expect(startOfWeek("2026-10-23")).toBe("2026-10-19"); // sexta
    expect(startOfWeek("2026-10-25")).toBe("2026-10-19"); // domingo
    expect(startOfWeek("2026-10-19")).toBe("2026-10-19"); // segunda
  });

  it("soma dias sem saltar na mudança de hora (25 de outubro de 2026)", () => {
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(weekDays("2026-10-19")).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });

  it("muda de mês e de ano", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(startOfWeek("2027-01-01")).toBe("2026-12-28");
  });

  it("conta dias entre datas, também através da mudança de hora", () => {
    expect(daysBetween("2026-10-23", "2026-10-26")).toBe(3);
    expect(daysBetween("2026-10-26", "2026-10-23")).toBe(-3);
    expect(daysBetween("2026-10-23", "2026-10-23")).toBe(0);
  });

  it("valida datas vindas da query string", () => {
    expect(isIsoDate("2026-10-19")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("19-10-2026")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });

  it("hoje é o dia do relógio local", () => {
    expect(today(new Date(2026, 9, 23, 23, 30))).toBe("2026-10-23");
  });
});
