import { describe, expect, it } from "vitest";
import { goalValuesFrom, parseGoalValues, type GoalValues } from "./goalsForm";

function values(overrides: Partial<GoalValues>): GoalValues {
  return { ...goalValuesFrom(null), ...overrides };
}

describe("parseGoalValues", () => {
  it("deixa vazio como sem alvo e lê vírgula e ponto decimal", () => {
    const parsed = parseGoalValues(values({ energyKcal: "1800", saltG: "5,5", fatG: " 55.04 " }));

    expect(parsed).toEqual({
      ok: true,
      request: {
        energyKcal: 1800,
        proteinG: null,
        carbsG: null,
        fatG: 55,
        fiberG: null,
        sugarG: null,
        saturatesG: null,
        saltG: 5.5,
        maxFatPerMealG: null,
      },
    });
  });

  it("exige pelo menos um valor", () => {
    expect(parseGoalValues(values({}))).toMatchObject({ ok: false });
  });

  it("recusa o que não é número e o que está fora do intervalo da Api", () => {
    expect(parseGoalValues(values({ energyKcal: "muita" }))).toMatchObject({ ok: false, error: expect.stringContaining("Energia") });
    expect(parseGoalValues(values({ energyKcal: "99999" }))).toMatchObject({ ok: false, error: expect.stringContaining("entre 500") });
    expect(parseGoalValues(values({ saltG: "0" }))).toMatchObject({ ok: false });
  });
});

describe("goalValuesFrom", () => {
  it("mostra os valores guardados com vírgula decimal e os alvos em falta vazios", () => {
    const form = goalValuesFrom({
      memberId: "m",
      isSet: true,
      energyKcal: 1800,
      proteinG: null,
      carbsG: null,
      fatG: null,
      fiberG: null,
      sugarG: null,
      saturatesG: null,
      saltG: 5.5,
      maxFatPerMealG: null,
      updatedAt: null,
    });

    expect(form.energyKcal).toBe("1800");
    expect(form.saltG).toBe("5,5");
    expect(form.proteinG).toBe("");
  });
});
