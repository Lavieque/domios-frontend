// Demo household state: what the real Api keeps per household (pantry, lists,
// plan, meals, purchases...). Seeded around today's date and saved in this
// browser's localStorage until "Reset demo".

import { addDays, today } from "../plan/dates";
import { chains, l, productById, recipeById, recipes, type L } from "./catalog";

export const DEMO_STATE_KEY = "domios.demo.state";
const VERSION = 3;

export const DEMO_USER_ID = "u-demo";
export const DEMO_EMAIL = "rui.lopes@demo.domios.pt";
export const DEMO_HOUSEHOLD_ID = "h-demo";

/** A seeded name (follows the app language) or one the visitor typed. */
export type Text = string | L;

export interface Quantity {
  amount: number;
  unit: number;
}

export interface Member {
  memberId: string;
  name: string;
  role: number;
  dateOfBirth: string | null;
  dietaryRestrictions: string[];
  userId: string | null;
  defaultPortion: number;
}

export interface Household {
  householdId: string;
  name: string;
  timeZone: string;
  currency: string;
  locale: string;
  members: Member[];
  travelCostPerKm: number | null;
  maxStoreDistanceKm: number | null;
}

export interface PantryItem {
  pantryItemId: string;
  householdId: string;
  productId: string;
  quantity: Quantity;
  location: number;
  state: number;
  purchasedAt: string;
  expiresAt: string | null;
  openedAt: string | null;
  purchasedPrice: number | null;
  scanned: { barcode: string | null; name: string | null; brand: string | null; imageUrl: string | null } | null;
  sourceMealId: string | null;
  chainId: string | null;
  physicalStoreId: string | null;
  priceSource: "Typed" | "Offer" | null;
  /** For waste and consumption reports. */
  initialAmount: number;
  endedAt: string | null;
  discardReason: number | null;
}

export interface ListItem {
  shoppingListItemId: string;
  label: Text;
  productId: string | null;
  ingredientId: string | null;
  sourceRecipeId: string | null;
  quantity: Quantity;
  isPurchased: boolean;
  purchasedAt: string | null;
  storedInPantryAt: string | null;
  chainId: string | null;
  physicalStoreId: string | null;
  /** "Bought elsewhere". */
  boughtChainId: string | null;
  boughtPhysicalStoreId: string | null;
  typedPrice: number | null;
  plannedChainId: string | null;
  plannedPhysicalStoreId: string | null;
  plannedPrice: number | null;
}

export interface ShoppingList {
  shoppingListId: string;
  householdId: string;
  name: Text;
  status: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  chainId: string | null;
  physicalStoreId: string | null;
  plan: { plannedAt: string; chainId: string; physicalStoreId: string | null; travelCost: number | null } | null;
  items: ListItem[];
}

export interface PlannedMeal {
  plannedMealId: string;
  householdId: string;
  date: string;
  mealType: number;
  recipeId: string | null;
  title: Text;
  servings: number;
  participantMemberIds: string[];
  notes: string | null;
  status: number;
  mealId: string | null;
}

export interface Meal {
  mealId: string;
  householdId: string;
  date: string;
  mealType: number;
  recipeId: string | null;
  title: Text;
  servings: number;
}

export interface SavedRecipe {
  householdId: string;
  recipeId: string;
  origin: number;
  savedAt: string;
}

export interface OwnTemplate {
  mealPlanTemplateId: string;
  householdId: string;
  name: string;
  description: string | null;
  durationDays: number;
  servingsBasis: number;
  tags: string[];
  imageUrl?: string | null;
  entries: { mealPlanTemplateEntryId: string; dayIndex: number; mealType: number; recipeId: string; servings: number | null; notes: string | null; sortOrder: number }[];
}

export interface Purchase {
  householdId: string;
  date: string;
  chainId: string | null;
  physicalStoreId: string | null;
  productId: string;
  quantity: Quantity;
  paid: number | null;
  source: "Typed" | "Offer" | null;
}

export interface EventEntry {
  eventId: string;
  householdId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  occurredOn: string;
  payload: Record<string, unknown>;
}

export interface Goals {
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  saturatesG: number | null;
  saltG: number | null;
  maxFatPerMealG: number | null;
  updatedAt: string;
}

export interface DemoState {
  version: number;
  seededOn: string;
  language: "pt" | "en";
  avatar: string | null;
  emailVerified: boolean;
  households: Household[];
  pantry: PantryItem[];
  lists: ShoppingList[];
  planned: PlannedMeal[];
  meals: Meal[];
  saved: SavedRecipe[];
  templates: OwnTemplate[];
  opportunityStatus: Record<string, number>;
  events: EventEntry[];
  goals: Record<string, Goals>;
  avoided: Record<string, { ingredientId: string; severity: "Avoid" | "Limit"; note: string | null }[]>;
  purchases: Purchase[];
  conversions: Record<string, { unitWeightGrams?: number; densityGramsPerMilliliter?: number }>;
  seq: number;
}

// ------------------------------------------------------------------- storage

let state: DemoState | null = null;

export function getState(): DemoState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(DEMO_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === VERSION) state = parsed;
    }
  } catch {
    // Broken copy: seed again.
  }
  if (!state) {
    state = seed(window.localStorage.getItem("domios.language") === "en" ? "en" : "pt");
    save();
  }
  return state;
}

export function save(): void {
  if (!state) return;
  try {
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage full (a big avatar): keep it for this page only.
  }
}

/**
 * Back to the sample data or, with `empty`, to a new account: no household,
 * plan, lists or pantry (the guided tour fills them in). The catalogue
 * (products, stores, recipes, public menus) is the same either way.
 */
export function resetState(empty = false): void {
  const language = state?.language ?? (window.localStorage.getItem("domios.language") === "en" ? "en" : "pt");
  state = empty ? emptySeed(language) : seed(language);
  save();
}

function emptySeed(language: "pt" | "en"): DemoState {
  return {
    version: VERSION,
    seededOn: today(),
    language,
    avatar: null,
    emailVerified: true,
    households: [],
    pantry: [],
    lists: [],
    planned: [],
    meals: [],
    saved: [],
    templates: [],
    opportunityStatus: {},
    events: [],
    goals: {},
    avoided: {},
    purchases: [],
    conversions: {},
    seq: 0,
  };
}

export function nextId(prefix: string): string {
  const s = getState();
  s.seq += 1;
  return `${prefix}-${s.seq.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** An instant `days` from today, at `hour` local time. */
function at(days: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------- seed

function seed(language: "pt" | "en"): DemoState {
  const t0 = today();
  const H = DEMO_HOUSEHOLD_ID;
  let seq = 0;
  const id = (prefix: string) => `${prefix}-s${(++seq).toString(36)}`;

  const members: Member[] = [
    { memberId: "m-rui", name: "Rui", role: 0, dateOfBirth: "1986-09-30", dietaryRestrictions: [], userId: DEMO_USER_ID, defaultPortion: 1.25 },
    { memberId: "m-ana", name: "Ana", role: 1, dateOfBirth: "1988-04-12", dietaryRestrictions: [], userId: "u-ana", defaultPortion: 1 },
    { memberId: "m-ines", name: "Inês", role: 2, dateOfBirth: "2016-02-03", dietaryRestrictions: ["lactose"], userId: null, defaultPortion: 0.6 },
    { memberId: "m-avo", name: "Avó Lurdes", role: 3, dateOfBirth: "1952-11-21", dietaryRestrictions: [language === "en" ? "vegetarian" : "vegetariano"], userId: null, defaultPortion: 0.8 },
  ];

  const household: Household = {
    householdId: H, name: "Casa Lopes", timeZone: "Europe/Lisbon", currency: "EUR", locale: "pt-PT",
    members, travelCostPerKm: null, maxStoreDistanceKm: null,
  };

  // --- pantry
  const pantry: PantryItem[] = [];
  const addPantry = (
    productId: string, amount: number, location: number, expiresIn: number | null,
    opts: { state?: number; boughtDaysAgo?: number; chainId?: string; storeId?: string | null; price?: number | null; ended?: { daysAgo: number; reason: number | null; state: number } } = {},
  ) => {
    const product = productById.get(productId)!;
    const bought = opts.boughtDaysAgo ?? 4;
    const chainId = opts.chainId ?? chains[(pantry.length * 7) % chains.length].id;
    const price = opts.price === undefined ? Math.round(product.price * (amount / product.qty) * 100) / 100 : opts.price;
    pantry.push({
      pantryItemId: id("pi"), householdId: H, productId, quantity: { amount, unit: product.unit }, location,
      state: opts.ended?.state ?? opts.state ?? 0, purchasedAt: at(-bought, 18),
      expiresAt: expiresIn === null ? null : addDays(t0, expiresIn), openedAt: opts.state === 1 ? at(-1, 20) : null,
      purchasedPrice: price, scanned: null, sourceMealId: null, chainId, physicalStoreId: opts.storeId ?? null,
      priceSource: price === null ? null : "Offer", initialAmount: amount,
      endedAt: opts.ended ? at(-opts.ended.daysAgo, 21) : null, discardReason: opts.ended?.reason ?? null,
    });
  };
  // location: 0 Pantry, 1 Fridge, 2 Freezer, 3 Cabinet. state: 0 Sealed, 1 Open, 2 Frozen, 3 Consumed, 4 Discarded.
  addPantry("p-arroz-carolino", 1, 0, 300);
  addPantry("p-esparguete", 500, 0, 240);
  addPantry("p-penne", 500, 0, 260, { chainId: "ch-lidl", storeId: "ps-lidl-areeiro" });
  addPantry("p-azeite", 450, 3, 400, { state: 1 });
  addPantry("p-tomate-pelado", 400, 0, 500);
  addPantry("p-tomate-pelado", 400, 0, 480);
  addPantry("p-grao", 540, 0, 380);
  addPantry("p-cebola", 0.8, 0, 12);
  addPantry("p-alho", 150, 0, 20);
  addPantry("p-batata", 2, 0, 14, { chainId: "ch-pingodoce", storeId: "ps-pd-alvalade" });
  addPantry("p-cenoura", 0.6, 1, 6);
  addPantry("p-espinafres", 200, 1, 1, { chainId: "ch-continente", storeId: "ps-cont-telheiras" });
  addPantry("p-courgette", 1, 1, 3);
  addPantry("p-ovos", 8, 1, 9, { state: 1 });
  addPantry("p-leite", 1, 1, 2, { state: 1 });
  addPantry("p-leite", 1, 0, 60);
  addPantry("p-natas", 200, 1, 0);
  addPantry("p-iogurte", 2, 1, -1);
  addPantry("p-queijo", 120, 1, 5, { state: 1 });
  addPantry("p-manteiga", 180, 1, 40, { state: 1 });
  addPantry("p-frango", 600, 2, 90, { state: 2, chainId: "ch-lidl", storeId: "ps-lidl-lumiar" });
  addPantry("p-ervilhas", 450, 2, 200, { state: 2 });
  addPantry("p-salmao", 400, 1, 2, { chainId: "ch-pingodoce", storeId: "ps-pd-benfica" });
  addPantry("p-banana", 0.7, 0, 3);
  addPantry("p-cafe", 180, 3, 150, { state: 1 });
  addPantry("p-aveia", 300, 3, 120, { state: 1 });
  addPantry("p-detergente", 650, 3, null, { price: null });
  // Whole packs of the rest of the catalogue, so every aisle has something.
  const pack = (productId: string, location: number, expiresIn: number | null, opts: Parameters<typeof addPantry>[4] = {}) =>
    addPantry(productId, productById.get(productId)!.qty, location, expiresIn, opts);
  pack("p-arroz-basmati", 0, 280);
  pack("p-feijao", 0, 420);
  pack("p-farinha", 0, 150);
  pack("p-acucar", 0, 600);
  pack("p-pimento", 1, 5);
  pack("p-pepino", 1, 6);
  pack("p-limao", 1, 15);
  pack("p-maca", 0, 18);
  pack("p-laranja", 0, 16, { chainId: "ch-pingodoce", storeId: "ps-pd-alvalade" });
  pack("p-morango", 1, 2);
  pack("p-pera", 0, 7);
  pack("p-brocolos", 1, 4);
  pack("p-cogumelos", 1, 3, { chainId: "ch-continente", storeId: "ps-cont-colombo" });
  pack("p-coentros", 1, 4);
  pack("p-couve", 1, 3);
  pack("p-chourico", 1, 30, { state: 1 });
  pack("p-fiambre", 1, 4, { state: 1 });
  pack("p-porco", 2, 120, { state: 2 });
  pack("p-pato", 2, 150, { state: 2, chainId: "ch-auchan", storeId: "ps-auchan-amoreiras" });
  pack("p-pescada", 2, 180, { state: 2 });
  pack("p-camarao", 2, 160, { state: 2 });
  pack("p-ameijoas", 1, 1);
  pack("p-bacalhau", 2, 200, { state: 2 });
  pack("p-carne-picada", 2, 60, { state: 2 });
  pack("p-gelado", 2, 220);
  pack("p-atum", 3, 900);
  pack("p-sardinha", 3, 700);
  pack("p-canela", 3, 500, { state: 1 });
  pack("p-granola", 3, 90, { state: 1 });
  pack("p-mel", 3, 700, { state: 1 });
  pack("p-broa", 0, 2);
  pack("p-croissant", 0, 1);
  pack("p-pao-alentejano", 0, 3);
  pack("p-pao-forma", 0, 6, { state: 1 });
  pack("p-vinho", 3, null);
  pack("p-cerveja", 1, 180);
  pack("p-agua", 0, 365);
  pack("p-agua-gas", 0, 300);
  pack("p-sumo", 1, 4, { state: 1 });
  pack("p-lixivia", 3, null, { price: null });
  pack("p-detergente-roupa", 3, null);
  pack("p-papel-higienico", 3, null);
  pack("p-papel", 3, null);
  // One scanned at home (label read from the packaging).
  pack("p-tomate-pelado", 0, 540);
  pantry[pantry.length - 1].scanned = { barcode: productById.get("p-tomate-pelado")!.barcode, name: "Tomate pelado inteiro", brand: "Compal", imageUrl: productById.get("p-tomate-pelado")!.imageUrl ?? null };
  // History for the waste report.
  addPantry("p-alface", 1, 1, -6, { boughtDaysAgo: 12, ended: { daysAgo: 5, reason: 1, state: 4 } });
  addPantry("p-iogurte", 1, 1, -9, { boughtDaysAgo: 20, ended: { daysAgo: 8, reason: 0, state: 4 } });
  addPantry("p-pao", 3, 0, -3, { boughtDaysAgo: 6, ended: { daysAgo: 3, reason: 0, state: 4 } });
  addPantry("p-tomate", 0.4, 1, -2, { boughtDaysAgo: 10, ended: { daysAgo: 2, reason: 1, state: 4 } });
  addPantry("p-natas", 200, 1, -15, { boughtDaysAgo: 30, ended: { daysAgo: 14, reason: 2, state: 4 } });
  for (const [productId, amount, daysAgo] of [
    ["p-esparguete", 500, 3], ["p-carne-picada", 500, 3], ["p-batata", 1, 6], ["p-frango", 600, 9], ["p-arroz-basmati", 500, 9],
    ["p-ovos", 12, 11], ["p-leite", 1, 4], ["p-leite", 1, 8], ["p-pao", 6, 2], ["p-maca", 1, 7], ["p-bacalhau", 800, 16],
  ] as [string, number, number][]) {
    addPantry(productId, amount, 1, -daysAgo + 10, { boughtDaysAgo: daysAgo + 3, ended: { daysAgo, reason: null, state: 3 } });
  }

  // --- planned meals: this week and next few days
  const planned: PlannedMeal[] = [];
  const meals: Meal[] = [];
  const memberIds = members.map((m) => m.memberId);
  const plan = (dayOffset: number, mealType: number, recipeId: string, servings: number, cooked = false) => {
    const plannedMealId = id("pm");
    let mealId: string | null = null;
    if (cooked) {
      mealId = id("meal");
      meals.push({ mealId, householdId: H, date: addDays(t0, dayOffset), mealType, recipeId, title: recipeById.get(recipeId)!.title, servings });
    }
    planned.push({
      plannedMealId, householdId: H, date: addDays(t0, dayOffset), mealType, recipeId, title: recipeById.get(recipeId)!.title,
      servings, participantMemberIds: memberIds, notes: null, status: cooked ? 1 : 0, mealId,
    });
  };
  // From Monday of this week (at least three days back, cooked) to two weeks
  // ahead. Lunches and dinners never repeat inside a week; breakfast four days a week.
  const breakfastByWeekday: Record<number, string> = { 1: "r-papas-aveia", 3: "r-iogurte-granola", 5: "r-salada-fruta", 6: "r-tosta-mista" };
  const lunches = ["r-sopa-legumes", "r-salada-grao", "r-caldo-verde", "r-salada-atum", "r-feijoada-legumes", "r-sopa-feijao-couve", "r-salada-mista", "r-arroz-frango", "r-massa-cogumelos", "r-cozido"];
  const dinners = ["r-esparguete-bolonhesa", "r-frango-caril", "r-omelete-espinafres", "r-salmao-forno", "r-bacalhau-bras", "r-pescada-legumes", "r-porco-alentejana", "r-sardinhas-assadas", "r-arroz-pato"];
  const breakfasts = Object.values(breakfastByWeekday);
  const firstDay = Math.min(-3, -((new Date().getDay() + 6) % 7));
  for (let d = firstDay; d <= 13; d++) {
    const k = d - firstDay;
    const cooked = d < 0;
    const breakfast = breakfastByWeekday[new Date(Date.now() + d * 86_400_000).getDay()];
    if (breakfast) plan(d, 0, breakfast, 2, cooked);
    plan(d, 1, lunches[k % lunches.length], 3, cooked);
    plan(d, 2, dinners[k % dinners.length], 4, cooked);
  }
  // Sunday dessert for the birthday.
  plan(2, 3, "r-bolo-iogurte", 8);
  // Two months of meals for the nutrition history and "cooked" list.
  const rotation = recipes.map((r) => r.id);
  for (let d = -60; d <= -4; d++) {
    const n = d + 60;
    const lunch = lunches[(n * 3) % lunches.length];
    const dinner = rotation[(n * 7) % rotation.length];
    meals.push({ mealId: id("meal"), householdId: H, date: addDays(t0, d), mealType: 1, recipeId: lunch, title: recipeById.get(lunch)!.title, servings: 3 });
    meals.push({ mealId: id("meal"), householdId: H, date: addDays(t0, d), mealType: 2, recipeId: dinner, title: recipeById.get(dinner)!.title, servings: 4 });
    if (n % 2 === 0) {
      const b = breakfasts[(n / 2) % breakfasts.length];
      meals.push({ mealId: id("meal"), householdId: H, date: addDays(t0, d), mealType: 0, recipeId: b, title: recipeById.get(b)!.title, servings: 2 });
    }
  }
  // Leftovers from yesterday's dinner, kept in the fridge.
  {
    const yesterday = planned.find((p) => p.date === addDays(t0, -1) && p.mealType === 2)!;
    pantry.push({
      pantryItemId: id("pi"), householdId: H, productId: `p-sobras-${yesterday.recipeId}`, quantity: { amount: 2, unit: 0 }, location: 1, state: 0,
      purchasedAt: at(-1, 21), expiresAt: addDays(t0, 2), openedAt: null, purchasedPrice: null, scanned: null, sourceMealId: yesterday.mealId,
      chainId: null, physicalStoreId: null, priceSource: null, initialAmount: 2, endedAt: null, discardReason: null,
    });
  }

  // --- shopping lists
  const li = (label: Text, productId: string | null, ingredientId: string | null, amount: number, unit: number, extra: Partial<ListItem> = {}): ListItem => ({
    shoppingListItemId: id("sli"), label, productId, ingredientId, sourceRecipeId: null, quantity: { amount, unit },
    isPurchased: false, purchasedAt: null, storedInPantryAt: null, chainId: null, physicalStoreId: null,
    boughtChainId: null, boughtPhysicalStoreId: null, typedPrice: null, plannedChainId: null, plannedPhysicalStoreId: null, plannedPrice: null,
    ...extra,
  });
  const weekly: ShoppingList = {
    shoppingListId: "sl-semana", householdId: H, name: l("Compras da semana", "Weekly shop"), status: 0,
    createdAt: at(-2, 10), updatedAt: at(-1, 19), completedAt: null, chainId: null, physicalStoreId: null, plan: null,
    items: [
      li(l("Bacalhau demolhado", "Soaked salt cod"), "p-bacalhau", null, 400, 1, { sourceRecipeId: "r-bacalhau-bras" }),
      li(l("Pimento", "Bell pepper"), null, "i-pimento", 1, 0, { sourceRecipeId: "r-feijoada-legumes" }),
      li(l("Feijão encarnado", "Red kidney beans"), null, "i-feijao", 540, 1, { sourceRecipeId: "r-feijoada-legumes" }),
      li(l("Chouriço", "Chouriço sausage"), "p-chourico", null, 100, 1, { sourceRecipeId: "r-arroz-frango" }),
      li(l("Carne picada", "Minced beef"), null, "i-carne-picada", 500, 1),
      li(l("Pepino", "Cucumber"), null, "i-pepino", 1, 0),
      li(l("Limão", "Lemon"), null, "i-limao", 2, 0),
      li(l("Leite", "Milk"), "p-leite", null, 6, 4),
      li(l("Pão de forma integral", "Wholemeal sliced bread"), "p-pao-forma", null, 1, 0, { isPurchased: true, purchasedAt: at(-1, 18), chainId: null }),
      li(l("Rolos de cozinha", "Kitchen roll"), "p-papel", null, 2, 0),
      li(l("Velas de aniversário", "Birthday candles"), null, null, 1, 0),
    ],
  };
  const party: ShoppingList = {
    shoppingListId: "sl-festa", householdId: H, name: l("Lanche de anos da Inês", "Inês's birthday tea"), status: 0,
    createdAt: at(-1, 9), updatedAt: at(-1, 9), completedAt: null, chainId: "ch-continente", physicalStoreId: "ps-cont-colombo", plan: null,
    items: [
      li(l("Farinha de trigo", "Wheat flour"), "p-farinha", null, 1, 2),
      li(l("Açúcar", "Sugar"), "p-acucar", null, 1, 2),
      li(l("Ovos", "Eggs"), "p-ovos", null, 12, 0),
      li(l("Sumo de laranja", "Orange juice"), "p-sumo", null, 3, 4),
      li(l("Iogurte natural", "Plain yoghurt"), null, "i-iogurte", 4, 0),
    ],
  };
  const done: ShoppingList = {
    shoppingListId: "sl-feita", householdId: H, name: l("Compras de sábado", "Saturday shop"), status: 1,
    createdAt: at(-9, 10), updatedAt: at(-7, 12), completedAt: at(-7, 12), chainId: "ch-lidl", physicalStoreId: "ps-lidl-areeiro",
    plan: { plannedAt: at(-8, 21), chainId: "ch-lidl", physicalStoreId: "ps-lidl-areeiro", travelCost: 1.2 },
    items: [
      li(l("Peito de frango", "Chicken breast"), "p-frango", null, 600, 1, { isPurchased: true, purchasedAt: at(-7, 11), storedInPantryAt: at(-7, 12), plannedChainId: "ch-lidl", plannedPhysicalStoreId: "ps-lidl-areeiro", plannedPrice: 4.41, typedPrice: 4.29 }),
      li(l("Massa penne", "Penne pasta"), "p-penne", null, 500, 1, { isPurchased: true, purchasedAt: at(-7, 11), storedInPantryAt: at(-7, 12), plannedChainId: "ch-lidl", plannedPhysicalStoreId: "ps-lidl-areeiro", plannedPrice: 1.0 }),
      li(l("Batata", "Potatoes"), "p-batata", null, 3, 2, { isPurchased: true, purchasedAt: at(-7, 11), storedInPantryAt: at(-7, 12), boughtChainId: "ch-pingodoce", boughtPhysicalStoreId: "ps-pd-alvalade", plannedChainId: "ch-lidl", plannedPhysicalStoreId: "ps-lidl-areeiro", plannedPrice: 2.75, typedPrice: 2.99 }),
      li(l("Ervilhas congeladas", "Frozen peas"), "p-ervilhas", null, 450, 1, { isPurchased: true, purchasedAt: at(-7, 11), storedInPantryAt: at(-7, 12) }),
      li(l("Detergente", "Dishwashing liquid"), "p-detergente", null, 1, 0, { plannedChainId: "ch-lidl", plannedPhysicalStoreId: "ps-lidl-areeiro", plannedPrice: 2.11 }),
    ],
  };
  const bought = (daysAgo: number, chainId: string, storeId: string): Partial<ListItem> =>
    ({ isPurchased: true, purchasedAt: at(-daysAgo, 11), storedInPantryAt: at(-daysAgo, 12), plannedChainId: chainId, plannedPhysicalStoreId: storeId });
  const sunday: ShoppingList = {
    shoppingListId: "sl-domingo", householdId: H, name: l("Almoço de domingo", "Sunday lunch"), status: 0,
    createdAt: at(-1, 20), updatedAt: at(0, 9), completedAt: null, chainId: "ch-pingodoce", physicalStoreId: "ps-pd-alvalade", plan: null,
    items: [
      li(l("Pato inteiro", "Whole duck"), "p-pato", null, 1, 0, { sourceRecipeId: "r-arroz-pato" }),
      li(l("Chouriço", "Chouriço sausage"), "p-chourico", null, 200, 1, { sourceRecipeId: "r-arroz-pato" }),
      li(l("Arroz carolino", "Carolino rice"), "p-arroz-carolino", null, 1, 2, { sourceRecipeId: "r-arroz-pato" }),
      li(l("Laranja", "Oranges"), "p-laranja", null, 1, 2),
      li(l("Vinho tinto", "Red wine"), "p-vinho", null, 2, 0, { isPurchased: true, purchasedAt: at(0, 9) }),
      li(l("Canela em pau", "Cinnamon sticks"), "p-canela", null, 1, 0, { sourceRecipeId: "r-arroz-doce" }),
      li(l("Leite", "Milk"), "p-leite", null, 2, 4, { sourceRecipeId: "r-arroz-doce" }),
    ],
  };
  const house: ShoppingList = {
    shoppingListId: "sl-casa", householdId: H, name: l("Casa e limpeza", "Home and cleaning"), status: 0,
    createdAt: at(-4, 18), updatedAt: at(-4, 18), completedAt: null, chainId: "ch-auchan", physicalStoreId: "ps-auchan-amoreiras", plan: null,
    items: [
      li(l("Detergente da roupa", "Laundry detergent"), "p-detergente-roupa", null, 1, 0),
      li(l("Lixívia", "Bleach"), "p-lixivia", null, 2, 0),
      li(l("Papel higiénico", "Toilet paper"), "p-papel-higienico", null, 1, 0),
      li(l("Esponjas", "Sponges"), null, null, 1, 0),
      li(l("Sacos do lixo", "Bin bags"), null, null, 1, 0),
    ],
  };
  const fruit: ShoppingList = {
    shoppingListId: "sl-fruta", householdId: H, name: l("Fruta e legumes da semana", "This week's fruit and veg"), status: 0,
    createdAt: at(0, 8), updatedAt: at(0, 8), completedAt: null, chainId: null, physicalStoreId: null, plan: null,
    items: [
      li(l("Morangos", "Strawberries"), "p-morango", null, 2, 0),
      li(l("Pera Rocha", "Rocha pears"), "p-pera", null, 1, 2),
      li(l("Brócolos", "Broccoli"), "p-brocolos", null, 500, 1, { sourceRecipeId: "r-pescada-legumes" }),
      li(l("Cogumelos", "Mushrooms"), "p-cogumelos", null, 250, 1, { sourceRecipeId: "r-massa-cogumelos" }),
      li(l("Coentros", "Coriander"), "p-coentros", null, 1, 0, { sourceRecipeId: "r-porco-alentejana" }),
      li(l("Couve galega", "Portuguese kale"), "p-couve", null, 1, 0, { sourceRecipeId: "r-caldo-verde" }),
      li(l("Alface", "Lettuce"), "p-alface", null, 1, 0, { sourceRecipeId: "r-salada-mista" }),
    ],
  };
  const lastMonth: ShoppingList = {
    shoppingListId: "sl-mes", householdId: H, name: l("Compra grande do mês", "Big monthly shop"), status: 1,
    createdAt: at(-22, 19), updatedAt: at(-20, 12), completedAt: at(-20, 12), chainId: "ch-continente", physicalStoreId: "ps-cont-colombo",
    plan: { plannedAt: at(-21, 21), chainId: "ch-continente", physicalStoreId: "ps-cont-colombo", travelCost: 2.4 },
    items: [
      li(l("Azeite", "Olive oil"), "p-azeite", null, 1, 0, { ...bought(20, "ch-continente", "ps-cont-colombo"), plannedPrice: 7.49, typedPrice: 6.99 }),
      li(l("Atum em azeite", "Tuna in olive oil"), "p-atum", null, 3, 0, bought(20, "ch-continente", "ps-cont-colombo")),
      li(l("Sardinhas", "Sardines"), "p-sardinha", null, 2, 0, bought(20, "ch-continente", "ps-cont-colombo")),
      li(l("Café", "Coffee"), "p-cafe", null, 2, 0, bought(20, "ch-continente", "ps-cont-colombo")),
      li(l("Papel higiénico", "Toilet paper"), "p-papel-higienico", null, 1, 0, bought(20, "ch-continente", "ps-cont-colombo")),
      li(l("Água", "Water"), "p-agua", null, 2, 0, bought(20, "ch-continente", "ps-cont-colombo")),
      li(l("Granola", "Granola"), "p-granola", null, 1, 0, bought(20, "ch-continente", "ps-cont-colombo")),
    ],
  };
  const fishShop: ShoppingList = {
    shoppingListId: "sl-peixe", householdId: H, name: l("Peixe para a semana", "Fish for the week"), status: 1,
    createdAt: at(-15, 18), updatedAt: at(-14, 11), completedAt: at(-14, 11), chainId: "ch-pingodoce", physicalStoreId: "ps-pd-benfica", plan: null,
    items: [
      li(l("Pescada", "Hake"), "p-pescada", null, 1, 0, bought(14, "ch-pingodoce", "ps-pd-benfica")),
      li(l("Salmão", "Salmon"), "p-salmao", null, 1, 0, bought(14, "ch-pingodoce", "ps-pd-benfica")),
      li(l("Camarão", "Prawns"), "p-camarao", null, 1, 0, bought(14, "ch-pingodoce", "ps-pd-benfica")),
      li(l("Limão", "Lemons"), "p-limao", null, 1, 0, bought(14, "ch-pingodoce", "ps-pd-benfica")),
    ],
  };
  const cancelled: ShoppingList = {
    shoppingListId: "sl-churrasco", householdId: H, name: l("Churrasco (adiado)", "Barbecue (postponed)"), status: 2,
    createdAt: at(-12, 18), updatedAt: at(-10, 9), completedAt: null, chainId: null, physicalStoreId: null, plan: null,
    items: [
      li(l("Lombo de porco", "Pork loin"), "p-porco", null, 1, 2),
      li(l("Cerveja", "Beer"), "p-cerveja", null, 2, 0),
      li(l("Pão alentejano", "Alentejo bread"), "p-pao-alentejano", null, 2, 0),
      li(l("Carvão", "Charcoal"), null, null, 1, 0),
    ],
  };

  // --- purchase history (last six months) for spending and "last bought"
  const purchases: Purchase[] = [];
  const basket = [
    "p-leite", "p-pao", "p-ovos", "p-banana", "p-frango", "p-arroz-carolino", "p-esparguete", "p-tomate", "p-batata", "p-iogurte",
    "p-azeite", "p-queijo", "p-cafe", "p-cebola", "p-detergente", "p-salmao", "p-carne-picada", "p-agua", "p-laranja", "p-pera",
    "p-brocolos", "p-cogumelos", "p-couve", "p-fiambre", "p-pescada", "p-atum", "p-granola", "p-broa", "p-maca", "p-porco",
    "p-cenoura", "p-alface", "p-papel-higienico", "p-sumo", "p-manteiga", "p-chourico", "p-morango",
  ];
  const storeFor: Record<string, string> = { "ch-continente": "ps-cont-colombo", "ch-pingodoce": "ps-pd-alvalade", "ch-lidl": "ps-lidl-areeiro", "ch-auchan": "ps-auchan-amoreiras" };
  for (let week = 0; week < 26; week++) {
    const chain = chains[(week * 3 + 1) % chains.length];
    const date = at(-(week * 7 + 2), 11);
    const count = 14 + (week % 6);
    for (let k = 0; k < count; k++) {
      const productId = basket[(week * 5 + k * 7) % basket.length];
      const product = productById.get(productId)!;
      const price = Math.round(product.price * chain.factor * (1 + ((week + k) % 4) * 0.02) * 100) / 100;
      purchases.push({
        householdId: H, date, chainId: chain.id, physicalStoreId: storeFor[chain.id], productId,
        quantity: { amount: product.qty, unit: product.unit }, paid: k % 11 === 10 ? null : price, source: k % 3 === 0 ? "Typed" : "Offer",
      });
    }
  }

  const events: EventEntry[] = [];
  const ev = (daysAgo: number, eventType: string, aggregateType: string, aggregateId: string, payload: Record<string, unknown>) =>
    events.push({ eventId: id("ev"), householdId: H, eventType, aggregateType, aggregateId, occurredOn: at(-daysAgo, 10 + (events.length % 9)), payload });
  ev(40, "HouseholdCreated", "Household", H, { name: household.name });
  ev(40, "MemberAdded", "Household", H, { name: "Rui", memberId: "m-rui" });
  ev(39, "MemberAdded", "Household", H, { name: "Inês", memberId: "m-ines" });
  ev(20, "MemberAdded", "Household", H, { name: "Avó Lurdes", memberId: "m-avo" });
  ev(9, "ShoppingListCreated", "ShoppingList", "sl-feita", { name: done.name });
  ev(7, "ShoppingListCompleted", "ShoppingList", "sl-feita", { name: done.name });
  ev(38, "MemberAdded", "Household", H, { name: "Ana", memberId: "m-ana" });
  ev(30, "MealPlanTemplateCreated", "MealPlanTemplate", "t-casa-jantares", {});
  ev(22, "ShoppingListCreated", "ShoppingList", "sl-mes", { name: lastMonth.name });
  ev(20, "ShoppingListCompleted", "ShoppingList", "sl-mes", { name: lastMonth.name });
  ev(15, "ShoppingListCreated", "ShoppingList", "sl-peixe", { name: fishShop.name });
  ev(14, "ShoppingListCompleted", "ShoppingList", "sl-peixe", { name: fishShop.name });
  ev(14, "PantryItemDiscarded", "PantryItem", pantry.find((p) => p.productId === "p-natas" && p.state === 4)!.pantryItemId, { productId: "p-natas" });
  ev(12, "ShoppingListCreated", "ShoppingList", "sl-churrasco", { name: cancelled.name });
  ev(10, "ShoppingListCancelled", "ShoppingList", "sl-churrasco", { name: cancelled.name });
  ev(8, "PantryItemDiscarded", "PantryItem", pantry.find((p) => p.productId === "p-iogurte" && p.state === 4)!.pantryItemId, { productId: "p-iogurte" });
  ev(6, "MealPlanTemplateCreated", "MealPlanTemplate", "t-casa-natal", {});
  ev(5, "PantryItemDiscarded", "PantryItem", pantry.find((p) => p.productId === "p-alface" && p.state === 4)!.pantryItemId, { productId: "p-alface" });
  ev(4, "ShoppingListCreated", "ShoppingList", "sl-casa", { name: house.name });
  ev(3, "PantryItemDiscarded", "PantryItem", pantry.find((p) => p.productId === "p-pao" && p.state === 4)!.pantryItemId, { productId: "p-pao" });
  ev(2, "PantryItemDiscarded", "PantryItem", pantry.find((p) => p.productId === "p-tomate" && p.state === 4)!.pantryItemId, { productId: "p-tomate" });
  ev(1, "LeftoversStored", "PantryItem", pantry[pantry.length - 1].pantryItemId, {});
  ev(1, "ShoppingListCreated", "ShoppingList", "sl-domingo", { name: sunday.name });
  ev(0, "ShoppingListCreated", "ShoppingList", "sl-fruta", { name: fruit.name });
  for (const pm of planned.filter((p) => p.status === 1 && p.mealType === 2 && p.date >= addDays(t0, -3))) {
    const daysAgo = Math.round((Date.parse(t0) - Date.parse(pm.date)) / 86_400_000);
    ev(daysAgo, "MealLogged", "Meal", pm.mealId!, { title: (pm.title as L).pt, recipeId: pm.recipeId });
    ev(daysAgo, "PlannedMealCooked", "PlannedMeal", pm.plannedMealId, { recipeId: pm.recipeId });
  }
  ev(2, "ShoppingListCreated", "ShoppingList", "sl-semana", { name: weekly.name });
  ev(1, "ShoppingListItemPurchased", "ShoppingList", "sl-semana", { label: "Pão de forma integral", productId: "p-pao-forma" });
  ev(1, "ShoppingListCreated", "ShoppingList", "sl-festa", { name: party.name });
  ev(0, "OpportunityPresented", "Opportunity", "op-expiring", {});

  return {
    version: VERSION,
    seededOn: t0,
    language,
    avatar: "/demo/photos/avatar.jpg",
    emailVerified: true,
    households: [household],
    pantry,
    lists: [fruit, sunday, weekly, party, house, done, fishShop, lastMonth, cancelled],
    planned,
    meals,
    saved: [
      { householdId: H, recipeId: "r-bolo-iogurte", origin: 0, savedAt: at(-30) },
      { householdId: H, recipeId: "r-arroz-pato", origin: 0, savedAt: at(-24) },
      { householdId: H, recipeId: "r-caldo-verde", origin: 1, savedAt: at(-19) },
      { householdId: H, recipeId: "r-porco-alentejana", origin: 0, savedAt: at(-15) },
      { householdId: H, recipeId: "r-salmao-forno", origin: 0, savedAt: at(-11) },
      { householdId: H, recipeId: "r-arroz-doce", origin: 1, savedAt: at(-8) },
      { householdId: H, recipeId: "r-iogurte-granola", origin: 0, savedAt: at(-5) },
      { householdId: H, recipeId: "r-bacalhau-bras", origin: 1, savedAt: at(-2) },
      { householdId: H, recipeId: "r-omelete-espinafres", origin: 0, savedAt: at(-1) },
    ],
    templates: [
      {
        mealPlanTemplateId: "t-casa-jantares", householdId: H, name: language === "en" ? "Our quick suppers" : "Os nossos jantares rápidos",
        description: language === "en" ? "Weeknight dinners in under 30 minutes." : "Jantares de semana em menos de 30 minutos.",
        durationDays: 3, servingsBasis: 4, tags: [], imageUrl: "/demo/photos/t-casa-jantares.jpg",
        entries: [
          { mealPlanTemplateEntryId: id("te"), dayIndex: 0, mealType: 2, recipeId: "r-omelete-espinafres", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 1, mealType: 2, recipeId: "r-salada-grao", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 2, mealType: 2, recipeId: "r-salmao-forno", servings: 2, notes: null, sortOrder: 0 },
        ],
      },
      {
        mealPlanTemplateId: "t-casa-escola", householdId: H, name: language === "en" ? "Inês's school lunches" : "Lancheiras da Inês",
        description: language === "en" ? "Packed lunches for the school week." : "Almoços para levar durante a semana de escola.",
        durationDays: 5, servingsBasis: 1, tags: [language === "en" ? "school" : "escola"], imageUrl: "/demo/photos/t-casa-escola.jpg",
        entries: [
          { mealPlanTemplateEntryId: id("te"), dayIndex: 0, mealType: 1, recipeId: "r-salada-grao", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 1, mealType: 1, recipeId: "r-arroz-frango", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 2, mealType: 1, recipeId: "r-salada-atum", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 3, mealType: 1, recipeId: "r-feijoada-legumes", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 4, mealType: 1, recipeId: "r-salada-fruta", servings: null, notes: null, sortOrder: 0 },
        ],
      },
      {
        mealPlanTemplateId: "t-casa-natal", householdId: H, name: language === "en" ? "Christmas at grandma's" : "Natal em casa da avó",
        description: language === "en" ? "Christmas Eve and Christmas Day, the way the family likes it." : "Consoada e dia de Natal, como a família gosta.",
        durationDays: 2, servingsBasis: 8, tags: [language === "en" ? "christmas" : "natal"], imageUrl: "/demo/photos/t-casa-natal.jpg",
        entries: [
          { mealPlanTemplateEntryId: id("te"), dayIndex: 0, mealType: 2, recipeId: "r-bacalhau-bras", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 0, mealType: 3, recipeId: "r-arroz-doce", servings: null, notes: null, sortOrder: 1 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 1, mealType: 0, recipeId: "r-salada-fruta", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 1, mealType: 1, recipeId: "r-arroz-pato", servings: null, notes: null, sortOrder: 0 },
          { mealPlanTemplateEntryId: id("te"), dayIndex: 1, mealType: 2, recipeId: "r-caldo-verde", servings: null, notes: null, sortOrder: 0 },
        ],
      },
    ],
    opportunityStatus: {},
    events,
    goals: {
      "m-rui": { energyKcal: 2500, proteinG: 120, carbsG: 300, fatG: 85, fiberG: 30, sugarG: 60, saturatesG: 25, saltG: 5, maxFatPerMealG: 35, updatedAt: at(-18) },
      "m-ana": { energyKcal: 2000, proteinG: 90, carbsG: 250, fatG: 70, fiberG: 30, sugarG: 50, saturatesG: 20, saltG: 5, maxFatPerMealG: 30, updatedAt: at(-15) },
      "m-ines": { energyKcal: 1600, proteinG: 45, carbsG: 210, fatG: 55, fiberG: 20, sugarG: 35, saturatesG: 15, saltG: 3, maxFatPerMealG: 20, updatedAt: at(-12) },
      "m-avo": { energyKcal: 1700, proteinG: 70, carbsG: 210, fatG: 55, fiberG: 28, sugarG: 30, saturatesG: 15, saltG: 4, maxFatPerMealG: 22, updatedAt: at(-9) },
    },
    avoided: {
      "m-ines": [{ ingredientId: "i-natas", severity: "Avoid", note: null }, { ingredientId: "i-leite", severity: "Limit", note: null }],
      "m-avo": [
        { ingredientId: "i-chourico", severity: "Avoid", note: null },
        { ingredientId: "i-frango", severity: "Avoid", note: null },
        { ingredientId: "i-acucar", severity: "Limit", note: null },
      ],
      "m-rui": [{ ingredientId: "i-coentros", severity: "Limit", note: null }],
      "m-ana": [{ ingredientId: "i-camarao", severity: "Avoid", note: null }],
    },
    purchases,
    conversions: {},
    seq: 0,
  };
}
