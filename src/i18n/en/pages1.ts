import type { Dict } from "..";

export const createHousehold: Dict["createHousehold"] = {
  invalid: "Fill in the household's name and your name.",
  title: "Create household",
  lede: "A household brings together the pantry, the shopping lists and the meal plan. You'll be the administrator and can add the rest of the family later.",
  name: "Household name",
  yourName: "Your name",
  creating: "Creating…",
};

export const cooked: Dict["cooked"] = {
  back: "What can I cook",
  title: "Cooked recipes",
  subtitle: (household) => `What's been cooked at ${household}`,
  empty:
    "You haven't logged a meal from a recipe yet. When you cook one from the plan or from the recipe page, it shows up here.",
  times: (n) => (n === 1 ? "time" : "times"),
  saveAgain: "Save to make again",
  last: (date) => `Last on ${date}`,
  saved: "Saved",
  unavailable: "No longer available",
};

export const history: Dict["history"] = {
  title: "History",
  subtitle: "What changed in the household, newest first.",
  area: "History area",
  empty: "Nothing recorded here yet.",
};

export const lists: Dict["lists"] = {
  title: "Shopping lists",
  status: "Status",
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
  listName: "List name",
  newListPlaceholder: "New list name (optional)",
  creating: "Creating…",
  newList: "New list",
  none: { 0: "No open lists.", 1: "No completed lists.", 2: "No cancelled lists." },
  empty: "Empty",
  progress: (left, bought, total) => `${left} to buy · ${bought} of ${total} bought`,
};
