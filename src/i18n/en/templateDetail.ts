import type { Dict } from "..";

export const templateDetail: Dict["templateDetail"] = {
  title: "Meal plan",
  openFailed: "Couldn't open this meal plan.",
  back: "Back to meal plans",
  duplicate: "The same recipe appears twice in the same meal of this day.",
  forbiddenRecipe: "That recipe can't be part of this meal plan.",
  crumb: "Ready-made meal plans",
  summary: (days, meals, servings) =>
    `${days} ${days === 1 ? "day" : "days"} · ${meals} ${meals === 1 ? "meal" : "meals"} · ${servings} ${servings === 1 ? "serving" : "servings"} per meal`,
  apply: "Apply to plan",
  skippedOnCopy: (n) =>
    n === 1
      ? "1 recipe from the original meal plan is no longer available and was left out of the copy."
      : `${n} recipes from the original meal plan are no longer available and were left out of the copy.`,
  days: "Days",
  day: "Day",
  editDay: (n) => `Edit day ${n}`,
  edit: "Edit",
  noMeals: "No meals.",
  servings: (n) => `${n} ${n === 1 ? "serving" : "servings"}`,
  unavailable: "No longer available",
  customize: "Customise",
  publishedOwn: "This meal plan has been published and won't change. Make a copy to edit it.",
  copyHint: "Want to swap recipes? Copy this meal plan to your household and edit the days.",
  copying: "Copying…",
  copy: "Make a copy to edit",
  editHint: "This meal plan belongs to your household: press “Edit” on a day to swap, add or remove recipes.",
  policySkip: "Keep what's already planned",
  policyReplace: "Replace what's already planned (never what's already cooked)",
  policyFail: "Don't apply if any meals are taken",
  pickFirstDay: "Choose the first day.",
  servingsRange: "Servings must be between 1 and 50.",
  conflict: "There are already meals planned on those days. Choose keep or replace.",
  nothingAdded: "Nothing was added to the plan.",
  created: (n, from, to) => `${n} ${n === 1 ? "meal added" : "meals added"} from ${from} to ${to}.`,
  removed: (n) => ` ${n} ${n === 1 ? "meal replaced" : "meals replaced"}.`,
  skippedMeals: (n) =>
    n === 1
      ? " 1 meal in the plan was already taken and was left as it was."
      : ` ${n} meals in the plan were already taken and were left as they were.`,
  skippedEntries: (n) =>
    n === 1
      ? " 1 recipe from the meal plan is no longer available and was skipped."
      : ` ${n} recipes from the meal plan are no longer available and were skipped.`,
  restrictions: "Watch out for dietary restrictions:",
  seePlan: "See the plan",
  applyAgain: "Apply again",
  firstDay: "First day",
  range: (fromDay, from, toDay, to) => `From ${fromDay}, ${from}, to ${toDay}, ${to}.`,
  servingsPerMeal: "Servings per meal",
  ifTaken: "If there are already meals on those days",
  applying: "Applying…",
};
