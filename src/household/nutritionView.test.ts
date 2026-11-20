import { describe, expect, it } from "vitest";
import type { MemberNutritionGoalsDto } from "../api/memberPreferences";
import type { GoalIntakePercentDto, NutrientsDto, NutritionDayDto, NutritionSummaryDto } from "../api/nutrition";
import type { MemberDto } from "../api/households";
import type { MealNutritionDto } from "../api/nutrition";
import { goalRows, mealShares, mealsOverFatLimit } from "./nutritionView";

const zero: NutrientsDto = { energyKcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, saturates: 0, fiber: 0, salt: 0 };
const noPercent: GoalIntakePercentDto = {
  energyKcal: null, protein: null, carbs: null, sugar: null, fat: null, saturates: null, fiber: null, salt: null,
};

function day(date: string, mealsOverFat: number | null): NutritionDayDto {
  return { date, mealCount: 1, nutrients: zero, referenceIntakePercent: null, goalIntakePercent: null, mealsOverFatLimit: mealsOverFat };
}

function summary(over: Partial<NutritionSummaryDto>): NutritionSummaryDto {
  return {
    from: "2026-11-02", to: "2026-11-03", memberId: "m", mealCount: 2, coveredItemCount: 2, uncoveredItemCount: 0,
    total: zero, days: [day("2026-11-02", null), day("2026-11-03", null)], goalIntakePercent: null, ...over,
  };
}

const goals: MemberNutritionGoalsDto = {
  memberId: "m", isSet: true, energyKcal: 2000, proteinG: null, carbsG: null, fatG: null, fiberG: null,
  sugarG: null, saturatesG: null, saltG: 5, maxFatPerMealG: null, updatedAt: null,
};

describe("goalRows", () => {
  it("makes one row per nutrient that has a target, with the average day", () => {
    const rows = goalRows(
      summary({
        total: { ...zero, energyKcal: 3000, salt: 14 },
        goalIntakePercent: { ...noPercent, energyKcal: 75, salt: 140 },
      }),
      goals,
    );

    expect(rows.map((r) => r.key)).toEqual(["energyKcal", "salt"]);
    expect(rows[0]).toMatchObject({ perDay: 1500, target: 2000, percent: 75, isMax: false, overTarget: false });
    expect(rows[1]).toMatchObject({ perDay: 7, target: 5, percent: 140, isMax: true, overTarget: true });
  });

  it("only calls it over the target for a maximum", () => {
    const rows = goalRows(
      summary({ goalIntakePercent: { ...noPercent, energyKcal: 130 } }),
      goals,
    );
    expect(rows[0].overTarget).toBe(false);
  });

  it("is empty with no targets, no percentages or no days", () => {
    expect(goalRows(summary({}), goals)).toEqual([]);
    expect(goalRows(summary({ goalIntakePercent: { ...noPercent, salt: 50 } }), { ...goals, isSet: false })).toEqual([]);
    expect(goalRows(summary({ goalIntakePercent: { ...noPercent, salt: 50 } }), null)).toEqual([]);
    expect(goalRows(summary({ days: [], goalIntakePercent: { ...noPercent, salt: 50 } }), goals)).toEqual([]);
  });
});

describe("mealsOverFatLimit", () => {
  it("adds the days up", () => {
    expect(mealsOverFatLimit(summary({ days: [day("2026-11-02", 1), day("2026-11-03", 2)] }))).toBe(3);
  });

  it("is null without a fat-per-meal target", () => {
    expect(mealsOverFatLimit(summary({}))).toBeNull();
  });
});

describe("mealShares", () => {
  const members = [{ memberId: "a", name: "Ana" }, { memberId: "b", name: "Rui" }] as MemberDto[];
  const meal = (perMember: MealNutritionDto["perMember"]): MealNutritionDto => ({
    mealId: "x", total: zero, perParticipant: null, coveredItemCount: 1, uncoveredItemCount: 0, perMember,
  });

  it("gives each participant their own part, with the name from the household", () => {
    const rows = mealShares(
      meal([
        { memberId: "a", portion: 1, nutrients: { ...zero, energyKcal: 400 } },
        { memberId: "b", portion: 0.5, nutrients: { ...zero, energyKcal: 200 } },
      ]),
      members,
    );
    expect(rows.map((r) => [r.name, r.portion, r.nutrients.energyKcal])).toEqual([["Ana", 1, 400], ["Rui", 0.5, 200]]);
  });

  it("keeps a member who left the household, with no name", () => {
    const rows = mealShares(meal([{ memberId: "gone", portion: 1, nutrients: zero }]), members);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBeNull();
  });

  it("gives nothing when the Api has no perMember or no participants", () => {
    expect(mealShares(meal(undefined), members)).toEqual([]);
    expect(mealShares(meal(null), members)).toEqual([]);
    expect(mealShares(meal([]), members)).toEqual([]);
  });
});
