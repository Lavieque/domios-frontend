import type { Dict } from "..";

export const lists2: Dict["lists2"] = {
  searching: "Searching…",
  andMore: (n) => ` and ${n} more`,
  all: "All",
  allCategories: "All categories",
  category: "Category",
};

export const templates: Dict["templates"] = {
  title: "Ready-made menus",
  subtitle: "Week, fortnight or month plans to apply to your plan from a given day",
  all: "All menus",
  count: (total, n, searching) => `${total} ${searching ? "found" : n === 1 ? "menu" : "menus"}`,
  search: "Search menus",
  searchPlaceholder: "Search menus…",
  noneFound: "No menus match that search.",
  nonePublished: "No menus published yet.",
  days: (n) => (n === 1 ? "day" : "days"),
  meals: (n) => `${n} ${n === 1 ? "meal" : "meals"}`,
  servings: (n) => `${n} ${n === 1 ? "serving" : "servings"}`,
  mine: "My menus",
  editable: "Editable",
};

export const promotions: Dict["promotions"] = {
  title: "Promotions",
  subtitle: "On promotion at each store's latest reading, from the last 3 days.",
  filters: "Filters",
  filtersCount: (n) => `Filters · ${n}`,
  clear: "Clear",
  card: "Card",
  anyCard: "With or without card",
  cardOnly: "Card only",
  noCard: "Without card only",
  minDiscount: "Minimum discount",
  anyDiscount: "Any discount",
  orMore: (value) => `${value}% or more`,
  count: (total, n) => `${total} ${n === 1 ? "product" : "products"} on promotion`,
  none: "No active promotions right now.",
};

export const recipes: Dict["recipes"] = {
  title: "Recipes",
  forCooking: "To cook, plan or put on the list",
  withFilters: (total, n) => `${total} ${n === 1 ? "recipe" : "recipes"} with these filters`,
  published: (total) => `${total} published recipes, to cook, plan or put on the list`,
  ourPick: "Our pick",
  explore: "Explore recipes",
  search: "Search recipes",
  searchPlaceholder: "Search recipes…",
  difficulty: "Difficulty",
  anyDifficulty: "Any difficulty",
  mainProtein: "Main protein",
  none: "No recipes with these filters.",
  cookedMark: (times, last) => `Cooked ${times === 1 ? "once" : `${times} times`}, last on ${last}.`,
  cookedShort: "Cooked",
};
