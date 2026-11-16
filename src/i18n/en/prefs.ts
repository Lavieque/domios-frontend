import type { Dict } from "..";

export const prefs: Dict["prefs"] = {
  errors: {
    forbidden: "Only the member themselves or a household admin can change this.",
    invalid: "Some value isn't valid. Check what you typed.",
    full: "This list already has 200 foods.",
    notFound: "That food no longer exists.",
  },
  severity: { Avoid: "Avoid", Limit: "A little" },
  avoidedOf: (name) => `Foods ${name} avoids`,
  avoidedNote: (name) => `This list belongs to ${name}: DomiOS only flags it in recipes, it doesn't say what to eat.`,
  emptyList: "No foods on this list yet.",
  remove: "Remove",
  addFood: "Add food",
  addPlaceholder: "E.g. tomato, coffee, onion",
  results: "Results",
  howMuch: "How much",
  avoid: "Avoid",
  limit: "Only a little",
  note: "Note",
  notePlaceholder: "E.g. only raw, at night",
  optional: "Optional.",
  add: "Add",
  goalsOf: (name) => `${name}'s nutrition goals`,
  goalsNote: (name) =>
    `These values belong to ${name}. They compare what's eaten with what the person wants; anything left blank uses the European reference intake.`,
  saved: "Saved.",
  clearGoals: "Delete goals",
};
