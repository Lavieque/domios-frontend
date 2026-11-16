import type { Dict } from "..";

export const cook: Dict["cook"] = {
  title: "What can I cook",
  subtitle: (household) => `With what's in the pantry at ${household}`,
  cooked: "Recipes already cooked",
  suggestion: "Suggestion for today",
  meta: (servings, available, required) =>
    `${servings} ${servings === 1 ? "person" : "people"} · ${available} of ${required} ingredients at home`,
  yours: "Your recipes",
  noSaved: {
    before: "You haven't saved any recipes yet. Open a",
    link: "recipe",
    after: "and tap “Save recipe”; the ones you put on a shopping list are saved automatically.",
  },
  alsoPossible: "You could also make",
  nothingElse: "Nothing else with what's in the pantry.",
  seePantry: "See the pantry",
};

export const stores: Dict["stores"] = {
  title: "Nearby stores",
  subtitle: "Supermarkets with prices in DomiOS, nearest first, with the cost of the round trip",
  chain: "Chain",
  allChains: "All chains",
  needLocation:
    "To show nearby stores, DomiOS needs this device's location. It's used for this request only and isn't stored.",
  useLocation: "Use my location",
  searching: "Looking for stores…",
  summary: (count, km, perKm) =>
    `${count === 1 ? "1 store" : `${count} stores`} within ${km} km · travel at ${perKm}/km. Change the radius and cost per km in`,
  household: "Household",
  none: "No stores within the radius. Increase the maximum distance in Household.",
  hours: (hours) => `Hours: ${hours}`,
  roundTrip: (cost) => `round trip ${cost}`,
  attribution: (source) => `Approximate road distances. Stores: ${source}.`,
};

export const spending: Dict["spending"] = {
  back: "Shopping lists",
  title: "Spending",
  subtitle: (household) => `What was bought at ${household}, by month and by store`,
  period: "Period",
  lastMonths: (n) => `Last ${n} months`,
  total: "Total",
  estimated: (shelf, typed) => `${shelf} at the shelf price on the day of purchase; ${typed} entered by you.`,
  withoutPrice: (n) =>
    `${n === 1 ? "1 purchase without a price" : `${n} purchases without a price`} left out of the total: pick the list's store or enter what you paid.`,
  empty: {
    before: "No purchases in this period yet. Mark the items on a",
    link: "list",
    after: "as bought and pick the store: the price shows up here.",
  },
  moreWithoutPrice: (n) => (n === 1 ? "1 more purchase without a price." : `${n} more purchases without a price.`),
  noStore: "No store",
  purchases: (n) => (n === 1 ? "1 purchase" : `${n} purchases`),
  estimatedPart: (value) => `, ${value} estimated`,
  estimatedOnly: ", estimated",
};

export const waste: Dict["waste"] = {
  noCategory: "No category",
  unknownProduct: "Unknown product",
  back: "Pantry",
  title: "Food waste",
  subtitle: (household) => `What was thrown away at ${household}`,
  thisMonth: "This month",
  last3: "Last 3 months",
  last12: "Last 12 months",
  thrownAway: "Thrown away",
  items: (n) => (n === 1 ? "1 item" : `${n} items`),
  ofFinished: "Of what was used up",
  worth: "Worth about",
  valued: (valued, total) => `Value of ${valued} of ${total}: the others have no purchase price.`,
  none: "Nothing thrown away in this period.",
  why: "Why",
  noReason: "No reason",
  noReasonInline: "no reason",
  what: "What",
  articles: "Items",
  mistakeNote: "“Added by mistake” doesn't count towards the total or the percentage.",
};
