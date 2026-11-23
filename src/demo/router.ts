// The demo's fake DomiOS.Api: every route the app calls, answered in the
// browser from the demo catalog and the household state in localStorage.

import { getLanguage } from "../i18n/language";
import { addDays, today } from "../plan/dates";
import {
  DEMO_ORIGIN, U, categories, chainById, chains, genericProductFor, ingredientById, ingredients, physicalStoreById,
  physicalStores, products, recipeById, recipes, storeName, templates, tx, type DemoProduct, type DemoRecipe,
} from "./catalog";
import {
  LEFTOVER_PREFIX, baseUnit, cardPrice, checkRecipe, consumeIngredient, dateRange, hash, ingredientAllergens, ingredientRef,
  inStock, offerById, offerFor, offersFor, pantryStock, priceHistoryDto, priceInsight, productFor, promotionDto, recipeNutritionPerServing,
  round2, shelfPrice, storeOfferDto, toBase, toGrams, txt, unitPriceDto, type Offer,
} from "./logic";
import {
  DEMO_EMAIL, DEMO_USER_ID, getState, nextId, nowIso, save, type DemoState, type Household, type ListItem, type Member,
  type PantryItem, type PlannedMeal, type ShoppingList,
} from "./state";

export class DemoHttpError extends Error {
  readonly status: number;
  readonly type: string;
  constructor(status: number, type: string) {
    super(`${status} ${type}`);
    this.status = status;
    this.type = type;
  }
}

const notFound = (type = "not-found") => new DemoHttpError(404, type);

interface Ctx {
  method: string;
  params: URLSearchParams;
  // oxlint-disable-next-line no-explicit-any
  body: any;
  blob: Blob | null;
  m: string[];
}

type Handler = (ctx: Ctx) => unknown;
const routes: { method: string; pattern: RegExp; handler: Handler }[] = [];
const S = "([^/]+)";

function route(method: string, path: string, handler: Handler) {
  const pattern = new RegExp(`^${path.replace(/:[a-zA-Z]+/g, S)}$`);
  routes.push({ method, pattern, handler });
}

export async function handle(method: string, path: string, params: URLSearchParams, body: unknown, blob: Blob | null): Promise<unknown> {
  for (const r of routes) {
    if (r.method !== method) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;
    const result = await r.handler({ method, params, body: body ?? {}, blob, m: match.slice(1).map(decodeURIComponent) });
    if (method !== "GET") save();
    return result;
  }
  throw notFound("route-not-found");
}

// ------------------------------------------------------------------ helpers

const st = (): DemoState => getState();
const num = (ctx: Ctx, key: string, fallback: number) => {
  const v = Number(ctx.params.get(key));
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
const money = (amount: number | null) => (amount === null ? null : { amount: round2(amount), currency: "EUR" });

function paged<T>(items: T[], ctx: Ctx, defaultSize = 20) {
  const page = num(ctx, "page", 1);
  const pageSize = num(ctx, "pageSize", defaultSize);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}

function norm(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function matches(search: string | null, ...values: (string | null | undefined)[]): boolean {
  if (!search?.trim()) return true;
  const q = norm(search);
  return values.some((v) => v && norm(v).includes(q));
}

function household(id: string): Household {
  const h = st().households.find((x) => x.householdId === id);
  if (!h) throw new DemoHttpError(403, "not-household-member");
  return h;
}

function member(h: Household, memberId: string): Member {
  const m = h.members.find((x) => x.memberId === memberId);
  if (!m) throw notFound("member-not-found");
  return m;
}

function log(householdId: string | null, eventType: string, aggregateType: string, aggregateId: string, payload: Record<string, unknown> = {}) {
  st().events.push({ eventId: nextId("ev"), householdId, eventType, aggregateType, aggregateId, occurredOn: nowIso(), payload });
}

function recipeOrThrow(recipeId: string): DemoRecipe {
  const r = recipeById.get(recipeId);
  if (!r) throw notFound("recipe-not-found");
  return r;
}

// ----------------------------------------------------------- DTO builders

function categoryDto(categoryId: string) {
  const c = categories.find((x) => x.id === categoryId)!;
  return { categoryId: c.id, name: tx(c.name), parentCategoryId: null, scope: c.scope };
}

function productDto(product: DemoProduct) {
  return {
    productId: product.id,
    name: tx(product.name),
    brand: product.brand,
    category: categoryDto(product.categoryId),
    barcode: product.barcode || null,
    packageQuantity: product.qty,
    packageUnit: product.unit,
    imageUrl: product.imageUrl ?? null,
    allergens: product.allergens,
    nutritionFacts: product.nutrition,
    status: product.discontinued ? 1 : 0,
    source: 1,
    ingredientId: product.ingredientId,
    substitutedByProductId: product.substitutedBy ?? null,
  };
}

function recipeSummary(r: DemoRecipe) {
  const cost = recipeCost(r);
  return {
    recipeId: r.id, ownerHouseholdId: null, title: tx(r.title), difficulty: r.difficulty, status: 1, tags: r.tags.map(tx),
    sourceUrl: null, sourceCategory: null, dishType: r.dishType, mainProtein: r.mainProtein, classificationSource: 2, imageUrl: r.imageUrl,
    totalMinutes: r.prep + r.cook,
    cost: cost.ingredientCount === 0 ? null : {
      perServing: cost.perServing, total: cost.total, pricedIngredientCount: cost.pricedIngredientCount,
      ingredientCount: cost.ingredientCount, isReliable: cost.isReliable,
    },
  };
}

/** Como a Api (adenda 2026-11-23 de DomiOS_API_Fase1.md): o que a receita usa, ao preço médio das lojas. */
function recipeCost(r: DemoRecipe) {
  let total = 0;
  let required = 0;
  let priced = 0;
  const lines = r.ingredients.map((ing, i) => {
    const base = { recipeIngredientId: `${r.id}-ri${i}`, ingredientId: ing.ingredientId };
    const empty = { productId: null, productName: null, quantity: null, unit: null, packageQuantity: null, packagePrice: null, cost: null, storeCount: 0 };
    if (ing.optional || (ing.notes && /q\.?\s*b\.?|to taste/i.test(tx(ing.notes)))) return { ...base, ...empty, missing: null };
    required += 1;
    const product = genericProductFor(ing.ingredientId);
    if (!product) return { ...base, ...empty, missing: "NoProduct" };
    const offers = offersFor(product);
    const packBase = product.unit === U.un ? product.qty : toGrams(product.ingredientId, { amount: product.qty, unit: product.unit });
    const need = product.unit === U.un
      ? (ing.unit === U.un ? ing.amount : 1)
      : (ing.unit === U.un ? ing.amount * packBase : toGrams(ing.ingredientId, { amount: ing.amount, unit: ing.unit }));
    const quantity = round2((need / packBase) * product.qty);
    const productPart = { productId: product.id, productName: tx(product.name), quantity, unit: product.unit, packageQuantity: product.qty };
    if (offers.length === 0) return { ...base, ...productPart, packagePrice: null, cost: null, storeCount: 0, missing: "NoPrice" };
    const average = offers.reduce((sum, o) => sum + o.price, 0) / offers.length;
    const cost = (need / packBase) * average;
    total += cost;
    priced += 1;
    return { ...base, ...productPart, packagePrice: round2(average), cost: round2(cost), storeCount: offers.length, missing: null };
  });
  return {
    recipeId: r.id, servings: r.servings, total: round2(total), perServing: round2(total / Math.max(1, r.servings)),
    pricedIngredientCount: priced, ingredientCount: required, isReliable: required > 0 && priced >= required * 0.8, lines,
  };
}

function recipeDto(r: DemoRecipe) {
  return {
    ...recipeSummary(r),
    description: tx(r.description),
    servings: r.servings,
    prepTimeMinutes: r.prep,
    cookTimeMinutes: r.cook,
    source: 0,
    ingredients: r.ingredients.map((ing, i) => ({
      recipeIngredientId: `${r.id}-ri${i}`,
      ingredientId: ing.ingredientId,
      ingredientName: tx(ingredientById.get(ing.ingredientId)!.name),
      quantity: { amount: ing.amount, unit: ing.unit },
      notes: ing.notes ? tx(ing.notes) : null,
      isOptional: !!ing.optional,
      sortOrder: i,
    })),
    steps: r.steps.map((s, i) => ({ recipeStepId: `${r.id}-st${i}`, stepNumber: i + 1, instruction: tx(s.text), durationMinutes: s.minutes ?? null })),
  };
}

function householdDto(h: Household) {
  return {
    householdId: h.householdId, name: h.name, timeZone: h.timeZone, currency: h.currency, locale: h.locale,
    members: h.members.map((m) => ({ ...m })),
    travelCostPerKm: h.travelCostPerKm ?? 0.25,
    maxStoreDistanceKm: h.maxStoreDistanceKm ?? 10,
  };
}

function pantryDto(i: PantryItem) {
  return {
    pantryItemId: i.pantryItemId, householdId: i.householdId, productId: i.productId, quantity: i.quantity, location: i.location,
    state: i.state, purchasedAt: i.purchasedAt, expiresAt: i.expiresAt, openedAt: i.openedAt, purchasedPrice: money(i.purchasedPrice),
    batch: null, confidence: 1, scanned: i.scanned, sourceMealId: i.sourceMealId, purchasedChainId: i.chainId,
    purchasedPhysicalStoreId: i.physicalStoreId, purchasedPhysicalStoreName: i.physicalStoreId ? physicalStoreById.get(i.physicalStoreId)?.name ?? null : null,
    purchasedPriceSource: i.priceSource,
  };
}

function effectiveChain(list: ShoppingList, item: ListItem): { chainId: string | null; physicalStoreId: string | null } {
  if (item.boughtChainId) return { chainId: item.boughtChainId, physicalStoreId: item.boughtPhysicalStoreId };
  if (item.chainId) return { chainId: item.chainId, physicalStoreId: item.physicalStoreId };
  return { chainId: list.chainId, physicalStoreId: list.physicalStoreId };
}

function itemPaid(list: ShoppingList, item: ListItem): { price: number | null; source: "Typed" | "Offer" | null } {
  if (!item.isPurchased) return { price: null, source: null };
  if (item.typedPrice !== null) return { price: item.typedPrice, source: "Typed" };
  if (!item.productId) return { price: null, source: null };
  const shelf = shelfPrice(item.productId, effectiveChain(list, item).chainId);
  if (shelf === null) return { price: null, source: null };
  return { price: round2(shelf * packagesFor(item)), source: "Offer" };
}

function packagesFor(item: ListItem): number {
  const product = item.productId ? productFor(item.productId) : undefined;
  if (!product) return 1;
  const packBase = product.unit === U.un ? product.qty : toGrams(product.ingredientId, { amount: product.qty, unit: product.unit });
  const need = product.unit === U.un
    ? (item.quantity.unit === U.un ? item.quantity.amount : 1)
    : (item.quantity.unit === U.un ? item.quantity.amount * packBase : toGrams(product.ingredientId, item.quantity));
  return Math.max(1, Math.ceil(need / packBase - 1e-9));
}

function listItemDto(list: ShoppingList, item: ListItem) {
  const eff = effectiveChain(list, item);
  const paid = itemPaid(list, item);
  const planned = item.plannedChainId;
  return {
    shoppingListItemId: item.shoppingListItemId,
    label: txt(item.label),
    productId: item.productId,
    ingredientId: item.ingredientId,
    sourceRecipeId: item.sourceRecipeId,
    quantity: item.quantity,
    isPurchased: item.isPurchased,
    purchasedAt: item.purchasedAt,
    storedInPantryAt: item.storedInPantryAt,
    chainId: item.chainId,
    physicalStoreId: item.physicalStoreId,
    effectiveChainId: eff.chainId,
    effectivePhysicalStoreId: eff.physicalStoreId,
    paidPrice: money(paid.price),
    paidPriceSource: paid.source,
    physicalStoreName: eff.physicalStoreId ? physicalStoreById.get(eff.physicalStoreId)?.name ?? null : null,
    plannedChainId: planned,
    plannedPhysicalStoreId: item.plannedPhysicalStoreId,
    plannedPhysicalStoreName: item.plannedPhysicalStoreId ? physicalStoreById.get(item.plannedPhysicalStoreId)?.name ?? null : null,
    plannedPrice: money(item.plannedPrice),
    followedPlan: planned && item.isPurchased ? eff.chainId === planned : null,
    priceDifference: planned && item.isPurchased && paid.price !== null && item.plannedPrice !== null ? money(paid.price - item.plannedPrice) : null,
  };
}

function listDto(list: ShoppingList) {
  const items = list.items.map((i) => listItemDto(list, i));
  let plan = null;
  if (list.plan) {
    const withPlan = items.filter((i) => i.plannedChainId);
    const priced = withPlan.filter((i) => i.isPurchased && i.paidPrice && i.plannedPrice);
    const chain = chainById.get(list.plan.chainId);
    plan = {
      plannedAt: list.plan.plannedAt,
      chainId: list.plan.chainId,
      chainName: chain?.name ?? null,
      physicalStoreId: list.plan.physicalStoreId,
      physicalStoreName: list.plan.physicalStoreId ? physicalStoreById.get(list.plan.physicalStoreId)?.name ?? null : null,
      travelCost: money(list.plan.travelCost),
      plannedTotal: round2(priced.reduce((a, i) => a + i.plannedPrice!.amount, 0)),
      paidTotal: round2(priced.reduce((a, i) => a + i.paidPrice!.amount, 0)),
      boughtAsPlanned: withPlan.filter((i) => i.followedPlan === true).length,
      boughtElsewhere: withPlan.filter((i) => i.followedPlan === false).length,
      notBought: withPlan.filter((i) => !i.isPurchased).length,
      outsidePlan: items.filter((i) => !i.plannedChainId && i.isPurchased).length,
    };
  }
  return {
    shoppingListId: list.shoppingListId, householdId: list.householdId, name: txt(list.name), status: list.status,
    createdAt: list.createdAt, updatedAt: list.updatedAt, completedAt: list.completedAt, items,
    chainId: list.chainId, physicalStoreId: list.physicalStoreId,
    physicalStoreName: list.physicalStoreId ? physicalStoreById.get(list.physicalStoreId)?.name ?? null : null,
    plan,
  };
}

function plannedDto(pm: PlannedMeal) {
  return { ...pm, title: txt(pm.title) };
}

function getList(householdId: string, listId: string): ShoppingList {
  household(householdId);
  const list = st().lists.find((l) => l.shoppingListId === listId && l.householdId === householdId);
  if (!list) throw notFound("shopping-list-not-found");
  return list;
}

function getItem(list: ShoppingList, itemId: string): ListItem {
  const item = list.items.find((i) => i.shoppingListItemId === itemId);
  if (!item) throw notFound("shopping-list-item-not-found");
  return item;
}

function touch(list: ShoppingList) {
  list.updatedAt = nowIso();
}

function newListItem(partial: Partial<ListItem> & { label: string; quantity: { amount: number; unit: number } }): ListItem {
  return {
    shoppingListItemId: nextId("sli"), productId: null, ingredientId: null, sourceRecipeId: null, isPurchased: false, purchasedAt: null,
    storedInPantryAt: null, chainId: null, physicalStoreId: null, boughtChainId: null, boughtPhysicalStoreId: null, typedPrice: null,
    plannedChainId: null, plannedPhysicalStoreId: null, plannedPrice: null, ...partial,
  };
}

// ---------------------------------------------------------------- auth

function loginResult() {
  const far = new Date(Date.now() + 365 * 86_400_000).toISOString();
  return {
    userId: DEMO_USER_ID, token: "demo-access-token", accessTokenExpiresAt: far,
    refreshToken: "demo-refresh-token", refreshTokenExpiresAt: far, emailVerified: st().emailVerified,
  };
}

route("POST", "/auth/login", () => {
  // The language picked on the sign-in page wins over the one saved in the demo account.
  st().language = getLanguage();
  return loginResult();
});
route("POST", "/auth/refresh", () => loginResult());
route("POST", "/auth/register", () => ({ userId: DEMO_USER_ID }));
route("POST", "/auth/logout", () => undefined);
route("POST", "/auth/logout-all", () => undefined);
route("POST", "/auth/password/forgot", () => undefined);
route("POST", "/auth/password/reset", () => undefined);
route("POST", "/auth/email/verify", () => { st().emailVerified = true; });
route("POST", "/auth/email/verification-requests", () => undefined);

route("GET", "/account/preferences", () => ({ language: st().language }));
route("PUT", "/account/preferences", (c) => {
  st().language = c.body.language === "en" ? "en" : "pt";
  return { language: st().language };
});

route("GET", "/account/avatar", async () => {
  const avatar = st().avatar;
  if (!avatar) throw notFound("avatar-not-found");
  if (!avatar.startsWith("data:")) return await (await fetch(avatar)).blob();
  return fetchDataUrl(avatar);
});
route("PUT", "/account/avatar", async (c) => {
  if (c.blob) st().avatar = await blobToDataUrl(c.blob);
});
route("DELETE", "/account/avatar", () => { st().avatar = null; });

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function fetchDataUrl(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(",");
  const type = /data:([^;]+)/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type });
}

// -------------------------------------------------------------- catalog

route("GET", "/categories", () => categories.map((c) => categoryDto(c.id)));

route("GET", "/products", (c) => {
  const search = c.params.get("search");
  const categoryId = c.params.get("categoryId");
  const list = products.filter((p) => (!categoryId || p.categoryId === categoryId) && matches(search, tx(p.name), p.brand, p.name.pt, p.name.en, p.barcode));
  return paged(list.map(productDto), c);
});

route("GET", "/products/batch", (c) => (c.params.get("ids") ?? "").split(",").map((id) => productFor(id)).filter(Boolean).map((p) => productDto(p!)));

route("GET", "/products/batch/store-offers", (c) => {
  const out: Record<string, unknown[]> = {};
  for (const id of (c.params.get("ids") ?? "").split(",").filter(Boolean)) {
    const product = productFor(id);
    out[id] = product ? offersFor(product).map(storeOfferDto) : [];
  }
  return out;
});

route("GET", "/products/:id", (c) => {
  const product = productFor(c.m[0]);
  if (!product) throw notFound("product-not-found");
  return productDto(product);
});

route("GET", "/products/:id/store-offers", (c) => {
  const product = productFor(c.m[0]);
  if (!product) throw notFound("product-not-found");
  return offersFor(product).map(storeOfferDto);
});

route("GET", "/stores/:s/offers/:o/price-history", (c) => {
  const offer = offerById(c.m[1]);
  if (!offer || offer.chain.storeId !== c.m[0]) throw notFound("store-offer-not-found");
  const from = c.params.get("from");
  const to = c.params.get("to");
  return priceHistoryDto(offer).filter((p) => (!from || p.observedAt >= from) && (!to || p.observedAt <= to));
});

route("GET", "/ingredients", (c) => {
  const search = c.params.get("search");
  const list = ingredients.filter((i) => matches(search, tx(i.name), i.name.pt, i.name.en));
  return paged(list.map((i) => ({ ingredientId: i.id, name: tx(i.name), defaultUnit: i.defaultUnit, displayName: tx(i.name), canonicalIngredientId: null })), c, 8);
});

route("GET", "/chains", () => chains.map((ch) => ({ chainId: ch.id, name: ch.name, logoUrl: ch.logo, status: 0 })));

function allPromoOffers(): Offer[] {
  return products.flatMap((p) => offersFor(p)).filter((o) => o.promo);
}

route("GET", "/promotions", (c) => paged(allPromoOffers().map(promotionDto), c));

route("GET", "/promotions/current", (c) => {
  const chainId = c.params.get("chainId");
  const categoryId = c.params.get("categoryId");
  const requiresCard = c.params.get("requiresCard");
  const minDiscount = Number(c.params.get("minDiscountPercent") ?? 0);
  const list = allPromoOffers()
    .filter((o) => (!chainId || o.chain.id === chainId) && (!categoryId || o.product.categoryId === categoryId))
    .filter((o) => requiresCard === null || String(o.promo!.requiresCard) === requiresCard)
    .filter((o) => o.promo!.discountPercent >= minDiscount)
    .sort((a, b) => b.promo!.discountPercent - a.promo!.discountPercent || a.product.id.localeCompare(b.product.id))
    .map((o) => {
      const card = cardPrice(o);
      return {
        storeOfferId: o.storeOfferId, storeId: o.chain.storeId, storeName: storeName(o.chain), chainId: o.chain.id, chainName: o.chain.name,
        productId: o.product.id, productName: tx(o.product.name), imageUrl: o.product.imageUrl ?? null, packageQuantity: o.product.qty,
        packageUnit: o.product.unit, price: { amount: o.price, currency: "EUR" },
        cardPrice: card === null ? null : { amount: card, currency: "EUR", discountPercent: o.promo!.discountPercent, promotionId: o.promo!.promotionId, endsAt: o.promo!.endsAt },
        unitPrice: unitPriceDto(o.product, o.price), observedAt: new Date().toISOString(), promotion: promotionDto(o),
      };
    });
  return paged(list, c);
});

route("GET", "/promotions/:id", (c) => {
  const o = allPromoOffers().find((x) => x.promo!.promotionId === c.m[0]);
  if (!o) throw notFound("promotion-not-found");
  return promotionDto(o);
});

const dishTypeByName: Record<string, number> = { MainCourse: 0, Soup: 1, Starter: 2, SideDish: 3, Salad: 4, Dessert: 5, Breakfast: 6, Snack: 7, Drink: 8, Sauce: 9, Preserve: 10, Other: 11 };
const proteinByName: Record<string, number> = { Meat: 0, Fish: 1, Seafood: 2, Vegetarian: 3 };
const difficultyByName: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

route("GET", "/recipes", (c) => {
  const search = c.params.get("search");
  const dish = c.params.get("dishType");
  const protein = c.params.get("mainProtein");
  const difficulty = c.params.get("difficulty");
  const maxMinutes = Number(c.params.get("maxMinutes") ?? "") || null;
  const maxCost = Number(c.params.get("maxCostPerServing") ?? "") || null;
  const sort = c.params.get("sort");
  const list = recipes.filter((r) =>
    matches(search, tx(r.title), r.title.pt, r.title.en, ...r.tags.map(tx)) &&
    (!dish || r.dishType === dishTypeByName[dish]) &&
    (!protein || r.mainProtein === proteinByName[protein]) &&
    (!difficulty || r.difficulty === difficultyByName[difficulty])).map(recipeSummary)
    .filter((r) => maxMinutes === null || r.totalMinutes <= maxMinutes)
    .filter((r) => maxCost === null || (r.cost?.isReliable === true && r.cost.perServing <= maxCost));
  if (sort === "Cost") list.sort((a, b) => (a.cost?.isReliable ? a.cost.perServing : Infinity) - (b.cost?.isReliable ? b.cost.perServing : Infinity));
  if (sort === "Time") list.sort((a, b) => a.totalMinutes - b.totalMinutes);
  return paged(list, c);
});

route("GET", "/recipes/:id", (c) => recipeDto(recipeOrThrow(c.m[0])));

route("GET", "/recipes/:id/cost", (c) => recipeCost(recipeOrThrow(c.m[0])));

route("GET", "/events", (c) => {
  const type = c.params.get("aggregateType") ?? "";
  const id = c.params.get("aggregateId") ?? "";
  const own = st().events.filter((e) => e.aggregateType === type && e.aggregateId === id).map(eventDto);
  if (type === "Product" && productFor(id)) {
    own.push(eventDto({ eventId: `ev-${id}-created`, householdId: null, eventType: "ProductCreated", aggregateType: "Product", aggregateId: id, occurredOn: new Date(Date.now() - 120 * 86_400_000).toISOString(), payload: { name: tx(productFor(id)!.name) } }));
  }
  return own.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
});

function eventDto(e: DemoState["events"][number]) {
  return { eventId: e.eventId, eventType: e.eventType, aggregateType: e.aggregateType, aggregateId: e.aggregateId, occurredOn: e.occurredOn, payload: JSON.stringify(e.payload) };
}

route("GET", "/barcodes/:code", (c) => {
  const code = c.m[0];
  const product = products.find((p) => p.barcode && (p.barcode === code || p.barcode.padStart(14, "0") === code.padStart(14, "0")));
  if (!product) throw notFound("barcode-not-found");
  return {
    barcode: product.barcode.padStart(14, "0"), source: "catalog", name: tx(product.name), brand: product.brand, imageUrl: product.imageUrl ?? null,
    packageQuantity: product.qty, packageUnit: product.unit, productId: product.id,
  };
});

// ----------------------------------------------------- menus (templates)

function catalogTemplate(t: (typeof templates)[number]) {
  const entries = t.entries.map(([dayIndex, mealType, recipeId], i) => {
    const r = recipeById.get(recipeId)!;
    return {
      mealPlanTemplateEntryId: `${t.id}-e${i}`, dayIndex, mealType, recipeId, recipeTitle: tx(r.title), recipeStatus: 1,
      dishType: r.dishType, mainProtein: r.mainProtein, servings: t.servingsBasis, notes: null, sortOrder: i, recipeImageUrl: r.imageUrl,
    };
  });
  return {
    mealPlanTemplateId: t.id, ownerHouseholdId: null, name: tx(t.name), description: tx(t.description), durationDays: t.durationDays,
    servingsBasis: t.servingsBasis, tags: t.tags.map(tx), status: 1, imageUrl: t.imageUrl ?? null, entries,
  };
}

function ownTemplate(t: DemoState["templates"][number]) {
  return {
    mealPlanTemplateId: t.mealPlanTemplateId, ownerHouseholdId: t.householdId, name: t.name, description: t.description,
    durationDays: t.durationDays, servingsBasis: t.servingsBasis, tags: t.tags, status: 0, imageUrl: t.imageUrl ?? null,
    entries: t.entries.map((e) => {
      const r = recipeById.get(e.recipeId)!;
      return {
        mealPlanTemplateEntryId: e.mealPlanTemplateEntryId, dayIndex: e.dayIndex, mealType: e.mealType, recipeId: e.recipeId,
        recipeTitle: tx(r.title), recipeStatus: 1, dishType: r.dishType, mainProtein: r.mainProtein,
        servings: e.servings ?? t.servingsBasis, notes: e.notes, sortOrder: e.sortOrder, recipeImageUrl: r.imageUrl,
      };
    }),
  };
}

function summaryOf(t: ReturnType<typeof catalogTemplate> | ReturnType<typeof ownTemplate>) {
  const { entries, ...rest } = t;
  return { ...rest, entryCount: entries.length };
}

function findTemplate(id: string) {
  const cat = templates.find((t) => t.id === id);
  if (cat) return catalogTemplate(cat);
  const own = st().templates.find((t) => t.mealPlanTemplateId === id);
  if (own) return ownTemplate(own);
  throw notFound("meal-plan-template-not-found");
}

route("GET", "/meal-plan-templates", (c) => {
  const search = c.params.get("search");
  return paged(templates.filter((t) => matches(search, tx(t.name), tx(t.description))).map((t) => summaryOf(catalogTemplate(t))), c);
});
route("GET", "/meal-plan-templates/:id", (c) => findTemplate(c.m[0]));
route("PUT", "/meal-plan-templates/:id/entries", (c) => {
  const own = st().templates.find((t) => t.mealPlanTemplateId === c.m[0]);
  if (!own) throw new DemoHttpError(409, "meal-plan-template-not-editable");
  own.entries = (c.body.entries ?? []).map((e: Record<string, unknown>) => ({ ...e, mealPlanTemplateEntryId: nextId("te") }));
  log(own.householdId, "MealPlanTemplateEntriesReplaced", "MealPlanTemplate", own.mealPlanTemplateId, { name: own.name });
  return ownTemplate(own);
});
route("GET", "/households/:h/meal-plan-templates", (c) => {
  household(c.m[0]);
  return paged(st().templates.filter((t) => t.householdId === c.m[0]).map((t) => summaryOf(ownTemplate(t))), c, 100);
});
route("POST", "/households/:h/meal-plan-templates", (c) => {
  household(c.m[0]);
  const t = {
    mealPlanTemplateId: nextId("t"), householdId: c.m[0], name: String(c.body.name ?? ""), description: c.body.description ?? null,
    durationDays: Number(c.body.durationDays ?? 7), servingsBasis: Number(c.body.servingsBasis ?? 4), tags: c.body.tags ?? [],
    entries: (c.body.entries ?? []).map((e: Record<string, unknown>) => ({ ...e, mealPlanTemplateEntryId: nextId("te") })),
  };
  st().templates.push(t);
  log(c.m[0], "MealPlanTemplateCreated", "MealPlanTemplate", t.mealPlanTemplateId, { name: t.name });
  return ownTemplate(t);
});

// ------------------------------------------------------------ households

route("GET", "/households", () =>
  st().households
    .filter((h) => h.members.some((m) => m.userId === DEMO_USER_ID))
    .map((h) => {
      const me = h.members.find((m) => m.userId === DEMO_USER_ID)!;
      return { householdId: h.householdId, name: h.name, memberId: me.memberId, role: me.role };
    }));

route("POST", "/households", (c) => {
  const h: Household = {
    householdId: nextId("h"), name: String(c.body.name ?? "Casa"), timeZone: c.body.timeZone ?? "Europe/Lisbon", currency: c.body.currency ?? "EUR",
    locale: "pt-PT", travelCostPerKm: null, maxStoreDistanceKm: null,
    members: [{ memberId: nextId("m"), name: String(c.body.adminMemberName ?? "Eu"), role: 0, dateOfBirth: null, dietaryRestrictions: [], userId: DEMO_USER_ID, defaultPortion: 1 }],
  };
  st().households.push(h);
  log(h.householdId, "HouseholdCreated", "Household", h.householdId, { name: h.name });
  return householdDto(h);
});

route("GET", "/households/:h", (c) => householdDto(household(c.m[0])));

route("PATCH", "/households/:h", (c) => {
  const h = household(c.m[0]);
  const b = c.body;
  if (b.name !== undefined) h.name = b.name;
  if (b.timeZone !== undefined) h.timeZone = b.timeZone;
  if (b.currency !== undefined) h.currency = b.currency;
  if (b.locale !== undefined) h.locale = b.locale;
  if ("travelCostPerKm" in b) h.travelCostPerKm = b.travelCostPerKm;
  if ("maxStoreDistanceKm" in b) h.maxStoreDistanceKm = b.maxStoreDistanceKm;
  return householdDto(h);
});

route("GET", "/households/:h/timeline", (c) => {
  household(c.m[0]);
  const type = c.params.get("aggregateType");
  const exclude = c.params.get("excludeAggregateType");
  const list = st().events
    .filter((e) => e.householdId === c.m[0] && (!type || e.aggregateType === type) && (!exclude || e.aggregateType !== exclude))
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
    .map(eventDto);
  return paged(list, c);
});

route("POST", "/households/:h/members", (c) => {
  const h = household(c.m[0]);
  const m: Member = {
    memberId: nextId("m"), name: String(c.body.name ?? ""), role: Number(c.body.role ?? 1), dateOfBirth: c.body.dateOfBirth ?? null,
    dietaryRestrictions: c.body.dietaryRestrictions ?? [], userId: null, defaultPortion: 1,
  };
  h.members.push(m);
  log(h.householdId, "MemberAdded", "Household", h.householdId, { name: m.name, memberId: m.memberId });
  return householdDto(h);
});

route("PATCH", "/households/:h/members/:m", (c) => {
  const h = household(c.m[0]);
  const m = member(h, c.m[1]);
  const b = c.body;
  if (b.name !== undefined) m.name = b.name;
  if (b.role !== undefined) m.role = b.role;
  if (b.dietaryRestrictions !== undefined) m.dietaryRestrictions = b.dietaryRestrictions;
  if (b.defaultPortion !== undefined) m.defaultPortion = b.defaultPortion;
  log(h.householdId, "MemberUpdated", "Household", h.householdId, { name: m.name, memberId: m.memberId });
  return householdDto(h);
});

route("DELETE", "/households/:h/members/:m", (c) => {
  const h = household(c.m[0]);
  const m = member(h, c.m[1]);
  if (m.role === 0 && h.members.filter((x) => x.role === 0).length === 1) throw new DemoHttpError(409, "last-admin");
  h.members = h.members.filter((x) => x !== m);
  log(h.householdId, "MemberRemoved", "Household", h.householdId, { name: m.name, memberId: m.memberId });
  if (m.userId === DEMO_USER_ID) st().households = st().households.filter((x) => x !== h || x.members.some((y) => y.userId === DEMO_USER_ID));
});

route("POST", "/households/:h/members/:m/link-user", (c) => {
  const h = household(c.m[0]);
  const m = member(h, c.m[1]);
  const email = String(c.body.email ?? "");
  if (email.toLowerCase() === DEMO_EMAIL) throw new DemoHttpError(409, "user-already-linked");
  m.userId = `u-${Math.floor(hash(email) * 1e6)}`;
  log(h.householdId, "MemberLinkedToUser", "Household", h.householdId, { name: m.name, memberId: m.memberId });
});

// Convites de membro: na demo ninguém recebe o email, ficam só em memória para a casa os mostrar.
const demoInvites = new Map<string, { memberId: string; email: string; expiresAt: string }>();

route("POST", "/households/:h/members/:m/invites", (c) => {
  const h = household(c.m[0]);
  const m = member(h, c.m[1]);
  if (m.userId) throw new DemoHttpError(409, "member-already-linked");
  const email = String(c.body.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) throw new DemoHttpError(400, "invalid-argument");
  const invite = { memberId: m.memberId, email, expiresAt: `${addDays(today(), 7)}T12:00:00Z` };
  demoInvites.set(`${h.householdId}/${m.memberId}`, invite);
  log(h.householdId, "MemberInvited", "MemberInvite", m.memberId, { memberId: m.memberId });
  return invite;
});

route("DELETE", "/households/:h/members/:m/invites", (c) => {
  demoInvites.delete(`${c.m[0]}/${c.m[1]}`);
});

route("GET", "/households/:h/member-invites", (c) => {
  household(c.m[0]);
  return [...demoInvites.entries()].filter(([key]) => key.startsWith(`${c.m[0]}/`)).map(([, invite]) => invite);
});

// Na demo não há links de convite a abrir.
route("POST", "/member-invites/lookup", () => {
  throw new DemoHttpError(404, "invalid-invite");
});
route("POST", "/member-invites/accept", () => {
  throw new DemoHttpError(409, "invalid-invite");
});

const emptyGoals = (memberId: string) => ({
  memberId, isSet: false, energyKcal: null, proteinG: null, carbsG: null, fatG: null, fiberG: null, sugarG: null, saturatesG: null, saltG: null, maxFatPerMealG: null, updatedAt: null,
});

route("GET", "/households/:h/members/:m/nutrition-goals", (c) => {
  member(household(c.m[0]), c.m[1]);
  const g = st().goals[c.m[1]];
  return g ? { memberId: c.m[1], isSet: true, ...g } : emptyGoals(c.m[1]);
});
route("PUT", "/households/:h/members/:m/nutrition-goals", (c) => {
  member(household(c.m[0]), c.m[1]);
  const b = c.body;
  const keys = ["energyKcal", "proteinG", "carbsG", "fatG", "fiberG", "sugarG", "saturatesG", "saltG", "maxFatPerMealG"] as const;
  if (keys.every((k) => b[k] === null || b[k] === undefined)) throw new DemoHttpError(400, "invalid-argument");
  const g = Object.fromEntries(keys.map((k) => [k, b[k] ?? null])) as Record<(typeof keys)[number], number | null>;
  st().goals[c.m[1]] = { ...g, updatedAt: nowIso() };
  return { memberId: c.m[1], isSet: true, ...st().goals[c.m[1]] };
});
route("DELETE", "/households/:h/members/:m/nutrition-goals", (c) => {
  member(household(c.m[0]), c.m[1]);
  delete st().goals[c.m[1]];
});

function avoidedDto(a: { ingredientId: string; severity: "Avoid" | "Limit"; note: string | null }) {
  return { ingredientId: a.ingredientId, name: tx(ingredientById.get(a.ingredientId)?.name ?? { pt: a.ingredientId, en: a.ingredientId }), severity: a.severity, note: a.note };
}

route("GET", "/households/:h/members/:m/avoided-ingredients", (c) => {
  member(household(c.m[0]), c.m[1]);
  return { memberId: c.m[1], items: (st().avoided[c.m[1]] ?? []).map(avoidedDto) };
});
route("PUT", "/households/:h/members/:m/avoided-ingredients/:i", (c) => {
  member(household(c.m[0]), c.m[1]);
  if (!ingredientById.has(c.m[2])) throw notFound("ingredient-not-found");
  const list = (st().avoided[c.m[1]] ??= []);
  const entry = { ingredientId: c.m[2], severity: c.body.severity === "Limit" ? "Limit" as const : "Avoid" as const, note: c.body.note ?? null };
  const idx = list.findIndex((a) => a.ingredientId === c.m[2]);
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  return avoidedDto(entry);
});
route("DELETE", "/households/:h/members/:m/avoided-ingredients/:i", (c) => {
  member(household(c.m[0]), c.m[1]);
  st().avoided[c.m[1]] = (st().avoided[c.m[1]] ?? []).filter((a) => a.ingredientId !== c.m[2]);
});

function restrictionChecks(m: Member, r: DemoRecipe) {
  return m.dietaryRestrictions.map((restriction) => {
    const key = norm(restriction);
    if (["vegetarian", "vegetariano", "vegetariana", "vegan", "vegano"].includes(key)) {
      const bad = r.mainProtein !== null && r.mainProtein !== 3;
      return { restriction, result: bad ? 0 : 1, conflictingIngredients: [], ingredientsWithoutAllergenData: [], conflictingMainProtein: bad ? r.mainProtein : null };
    }
    const alias: Record<string, string> = { lactose: "lactose", lactoses: "lactose", gluten: "gluten", glúten: "gluten", leite: "milk", milk: "milk", ovo: "eggs", ovos: "eggs", eggs: "eggs", peixe: "fish", fish: "fish" };
    const allergen = alias[key];
    if (!allergen) return { restriction, result: 2, conflictingIngredients: [], ingredientsWithoutAllergenData: [], conflictingMainProtein: null };
    const conflicting = r.ingredients
      .filter((i) => !i.optional && ingredientAllergens(i.ingredientId).includes(allergen))
      .map((i) => ({ ...ingredientRef(i.ingredientId), allergen, source: "Allergen" as const }));
    return { restriction, result: conflicting.length ? 0 : 1, conflictingIngredients: conflicting, ingredientsWithoutAllergenData: [], conflictingMainProtein: null };
  });
}

function avoidedMatches(memberId: string, r: DemoRecipe) {
  const avoided = st().avoided[memberId] ?? [];
  const build = (optional: boolean) =>
    r.ingredients
      .filter((i) => !!i.optional === optional)
      .flatMap((i) => avoided.filter((a) => a.ingredientId === i.ingredientId).map((a) => ({
        ...ingredientRef(i.ingredientId), avoidedIngredient: tx(ingredientById.get(a.ingredientId)!.name), severity: a.severity,
        result: a.severity === "Avoid" ? "Conflict" as const : "Caution" as const, note: a.note,
      })));
  return { matches: build(false), optionalMatches: build(true) };
}

route("GET", "/households/:h/recipes/:r/restrictions", (c) => {
  const h = household(c.m[0]);
  const r = recipeOrThrow(c.m[1]);
  return {
    members: h.members.map((m) => ({ memberId: m.memberId, name: m.name, avoided: avoidedMatches(m.memberId, r), restrictions: restrictionChecks(m, r) })),
  };
});

function distanceKm(a: { latitude: number; longitude: number }, lat: number, lng: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat - a.latitude) * rad;
  const dLng = (lng - a.longitude) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Real position when it is near Lisbon; otherwise the demo's own spot, so the stores make sense. */
function originFrom(c: Ctx) {
  const lat = Number(c.params.get("lat"));
  const lng = Number(c.params.get("lng"));
  if (Number.isFinite(lat) && Number.isFinite(lng) && distanceKm(DEMO_ORIGIN, lat, lng) < 40) return { latitude: lat, longitude: lng };
  return DEMO_ORIGIN;
}

const ROAD_FACTOR = 1.3;

function nearby(h: Household, origin: { latitude: number; longitude: number }, radiusKm: number, chainId?: string | null) {
  const costPerKm = h.travelCostPerKm ?? 0.25;
  return physicalStores
    .filter((s) => !chainId || s.chainId === chainId)
    .map((s) => {
      const straightKm = round2(distanceKm(origin, s.lat, s.lng));
      const roadKm = round2(straightKm * ROAD_FACTOR);
      return {
        physicalStoreId: s.id, chainId: s.chainId, chainName: chainById.get(s.chainId)!.name, name: s.name, format: s.format, address: s.address,
        straightKm, roadKm, roundTripKm: round2(roadKm * 2), travelCost: { amount: round2(roadKm * 2 * costPerKm), currency: "EUR" }, openingHours: s.hours,
      };
    })
    .filter((s) => s.straightKm <= radiusKm)
    .sort((a, b) => a.straightKm - b.straightKm);
}

route("GET", "/households/:h/nearby-stores", (c) => {
  const h = household(c.m[0]);
  const origin = originFrom(c);
  const radiusKm = Math.min(50, num(c, "radiusKm", h.maxStoreDistanceKm ?? 10));
  return {
    origin, radiusKm, costPerKm: h.travelCostPerKm ?? 0.25, roadFactor: ROAD_FACTOR,
    stores: nearby(h, origin, radiusKm, c.params.get("chainId")), attribution: "© OpenStreetMap contributors (demo)",
  };
});

route("PUT", "/households/:h/ingredients/:i/conversion", (c) => {
  household(c.m[0]);
  const existing = st().conversions[c.m[1]];
  const applied = !existing;
  if (applied) st().conversions[c.m[1]] = { ...c.body };
  const v = st().conversions[c.m[1]];
  return { ingredientId: c.m[1], unitWeightGrams: v.unitWeightGrams ?? null, densityGramsPerMilliliter: v.densityGramsPerMilliliter ?? null, applied };
});

// ---------------------------------------------------------------- pantry

const stateByName: Record<string, number> = { Sealed: 0, Open: 1, Frozen: 2, Consumed: 3, Discarded: 4 };
const locationByName: Record<string, number> = { Pantry: 0, Fridge: 1, Freezer: 2, Cabinet: 3 };

function pantryItem(householdId: string, id: string): PantryItem {
  household(householdId);
  const item = st().pantry.find((i) => i.pantryItemId === id && i.householdId === householdId);
  if (!item) throw notFound("pantry-item-not-found");
  return item;
}

function pantryName(item: PantryItem): string {
  return item.scanned?.name ?? (productFor(item.productId) ? tx(productFor(item.productId)!.name) : item.productId);
}

route("GET", "/households/:h/pantry-items", (c) => {
  household(c.m[0]);
  const sort = c.params.get("sort");
  const stateName = c.params.get("state");
  const locationName = c.params.get("location");
  const before = c.params.get("expiringBefore");
  const search = c.params.get("search");
  let list = st().pantry.filter((i) => i.householdId === c.m[0]);
  if (stateName) list = list.filter((i) => i.state === stateByName[stateName]);
  else list = list.filter(inStock);
  if (locationName) list = list.filter((i) => i.location === locationByName[locationName]);
  if (before) list = list.filter((i) => i.expiresAt && i.expiresAt <= before);
  if (search) list = list.filter((i) => matches(search, pantryName(i), productFor(i.productId)?.brand, i.scanned?.brand));
  const byExpiry = (a: PantryItem, b: PantryItem) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999");
  if (sort === "fifo") list.sort((a, b) => (b.state === 1 ? 1 : 0) - (a.state === 1 ? 1 : 0) || byExpiry(a, b));
  else if (sort === "expiry") list.sort(byExpiry);
  else list.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  return paged(list.map(pantryDto), c);
});

function createPantryItem(householdId: string, b: { productId: string; quantity: { amount: number; unit: number }; location: number; purchasedAt?: string; expiresAt: string | null; purchasedPrice: { amount: number } | null; chainId?: string | null }): PantryItem {
  const product = productFor(b.productId);
  if (!product) throw notFound("product-not-found");
  if (b.chainId && !chainById.has(b.chainId)) throw notFound("chain-not-found");
  const item: PantryItem = {
    pantryItemId: nextId("pi"), householdId, productId: b.productId, quantity: b.quantity, location: b.location,
    state: b.location === 2 ? 2 : 0, purchasedAt: b.purchasedAt ?? nowIso(), expiresAt: b.expiresAt, openedAt: null,
    purchasedPrice: b.purchasedPrice?.amount ?? null, scanned: null, sourceMealId: null, chainId: b.chainId ?? null, physicalStoreId: null,
    priceSource: b.purchasedPrice ? "Typed" : null, initialAmount: b.quantity.amount, endedAt: null, discardReason: null,
  };
  if (item.purchasedPrice === null && item.chainId) {
    const shelf = shelfPrice(item.productId, item.chainId);
    if (shelf !== null) { item.purchasedPrice = round2(shelf * (item.quantity.amount / product.qty)); item.priceSource = "Offer"; }
  }
  st().pantry.push(item);
  log(householdId, "PantryItemAdded", "PantryItem", item.pantryItemId, { productId: item.productId, name: tx(product.name) });
  if (item.chainId) {
    st().purchases.push({ householdId, date: item.purchasedAt, chainId: item.chainId, physicalStoreId: null, productId: item.productId, quantity: item.quantity, paid: item.purchasedPrice, source: item.priceSource });
  }
  return item;
}

route("POST", "/households/:h/pantry-items", (c) => {
  household(c.m[0]);
  return pantryDto(createPantryItem(c.m[0], c.body));
});

route("POST", "/households/:h/pantry-items/batch", (c) => {
  household(c.m[0]);
  const items = (c.body.items ?? []) as { productId: string | null; ingredientId: string | null; quantity: { amount: number; unit: number }; location: number; expiresAt: string | null; purchasedPrice: { amount: number } | null; chainId?: string | null }[];
  // All or nothing: check first.
  const resolved = items.map((i) => {
    const productId = i.productId ?? (i.ingredientId ? genericProductFor(i.ingredientId)?.id : undefined);
    if (!productId || !productFor(productId)) throw notFound("product-not-found");
    return { ...i, productId };
  });
  return resolved.map((i) => pantryDto(createPantryItem(c.m[0], i)));
});

route("POST", "/households/:h/pantry-items/:i/open", (c) => {
  const item = pantryItem(c.m[0], c.m[1]);
  if (item.state === 0 || item.state === 2) { item.state = 1; item.openedAt = nowIso(); }
  log(c.m[0], "PantryItemOpened", "PantryItem", item.pantryItemId, { productId: item.productId, name: pantryName(item) });
});

route("POST", "/households/:h/pantry-items/:i/consume", (c) => {
  const item = pantryItem(c.m[0], c.m[1]);
  const amount = c.body.amount;
  if (amount === null || amount === undefined || amount >= item.quantity.amount - 1e-9) {
    item.quantity = { ...item.quantity, amount: 0 };
    item.state = 3;
    item.endedAt = nowIso();
  } else {
    item.quantity = { ...item.quantity, amount: round2(item.quantity.amount - amount) };
    if (item.state === 0) { item.state = 1; item.openedAt = nowIso(); }
  }
  log(c.m[0], "PantryItemConsumed", "PantryItem", item.pantryItemId, { productId: item.productId, name: pantryName(item) });
});

route("POST", "/households/:h/pantry-items/:i/discard", (c) => {
  const item = pantryItem(c.m[0], c.m[1]);
  item.state = 4;
  item.discardReason = Number(c.body.reason ?? 3);
  item.endedAt = nowIso();
  log(c.m[0], "PantryItemDiscarded", "PantryItem", item.pantryItemId, { productId: item.productId, name: pantryName(item) });
});

route("PATCH", "/households/:h/pantry-items/:i", (c) => {
  const item = pantryItem(c.m[0], c.m[1]);
  const b = c.body;
  if (b.location !== null && b.location !== undefined) {
    item.location = b.location;
    if (b.location === 2 && item.state === 0) item.state = 2;
    if (b.location !== 2 && item.state === 2) item.state = 0;
  }
  if (b.quantity) { item.quantity = b.quantity; log(c.m[0], "PantryItemQuantityChanged", "PantryItem", item.pantryItemId, { productId: item.productId }); }
  if (b.scanned !== undefined && b.scanned !== null) {
    const s = b.scanned;
    item.scanned = s.barcode || s.name || s.brand || s.imageUrl ? s : null;
  }
  if (b.expiresAt) item.expiresAt = b.expiresAt;
  return pantryDto(item);
});

function logMeal(householdId: string, date: string, mealType: number, recipeId: string | null, title: string | { pt: string; en: string }, servings: number): string {
  const mealId = nextId("meal");
  st().meals.push({ mealId, householdId, date, mealType, recipeId, title, servings });
  log(householdId, "MealLogged", "Meal", mealId, { title: typeof title === "string" ? title : tx(title), recipeId });
  return mealId;
}

route("POST", "/households/:h/meals/from-leftovers", (c) => {
  const item = pantryItem(c.m[0], c.body.pantryItemId);
  if (!item.sourceMealId) throw new DemoHttpError(400, "not-leftovers");
  const servings = Math.min(Number(c.body.servings ?? 1), item.quantity.amount);
  const recipeId = item.productId.slice(LEFTOVER_PREFIX.length);
  const recipe = recipeById.get(recipeId);
  const mealId = logMeal(c.m[0], today(), Number(c.body.mealType ?? 1), recipe ? recipeId : null, recipe?.title ?? pantryName(item), servings);
  item.quantity = { ...item.quantity, amount: round2(item.quantity.amount - servings) };
  if (item.quantity.amount <= 0) { item.state = 3; item.endedAt = nowIso(); }
  return { mealId };
});

route("GET", "/households/:h/pantry/waste", (c) => {
  household(c.m[0]);
  const from = c.params.get("from") ?? addDays(today(), -30);
  const to = c.params.get("to") ?? today();
  const inRange = (iso: string | null) => !!iso && iso.slice(0, 10) >= from && iso.slice(0, 10) <= to;
  const mine = st().pantry.filter((i) => i.householdId === c.m[0] && inRange(i.endedAt));
  const discarded = mine.filter((i) => i.state === 4);
  const counted = discarded.filter((i) => i.discardReason !== 2);
  const consumed = mine.filter((i) => i.state === 3);
  const value = (i: PantryItem) => {
    const product = productFor(i.productId);
    const full = i.purchasedPrice ?? (product ? product.price * (i.initialAmount / product.qty) : null);
    if (full === null) return null;
    return round2(full * (i.quantity.amount / (i.initialAmount || 1)));
  };
  const sum = (list: PantryItem[]) => {
    const values = list.map(value).filter((v): v is number => v !== null);
    return values.length ? money(values.reduce((a, b) => a + b, 0)) : null;
  };
  const reasons = [...new Set(discarded.map((i) => i.discardReason))];
  const cats = [...new Set(counted.map((i) => productFor(i.productId)?.categoryId ?? null))];
  const total = counted.length + consumed.length;
  return {
    from, to,
    discardedItemCount: counted.length,
    consumedItemCount: consumed.length,
    wastePercent: total ? round2((counted.length / total) * 100) : null,
    estimatedValue: sum(counted),
    valuedItemCount: counted.filter((i) => value(i) !== null).length,
    byReason: reasons.map((reason) => {
      const list = discarded.filter((i) => i.discardReason === reason);
      return { reason, itemCount: list.length, estimatedValue: sum(list) };
    }),
    byCategory: cats.map((categoryId) => {
      const list = counted.filter((i) => (productFor(i.productId)?.categoryId ?? null) === categoryId);
      return { categoryId, name: categoryId ? categoryDto(categoryId).name : null, itemCount: list.length, estimatedValue: sum(list) };
    }),
    items: discarded.sort((a, b) => b.endedAt!.localeCompare(a.endedAt!)).map((i) => ({
      pantryItemId: i.pantryItemId, productId: i.productId, productName: pantryName(i), quantity: i.quantity,
      reason: i.discardReason, discardedAt: i.endedAt!, estimatedValue: money(value(i)),
    })),
  };
});

// ---------------------------------------------------------------- plan

function plannedMeal(householdId: string, id: string): PlannedMeal {
  household(householdId);
  const pm = st().planned.find((p) => p.plannedMealId === id && p.householdId === householdId);
  if (!pm) throw notFound("planned-meal-not-found");
  return pm;
}

route("GET", "/households/:h/planned-meals", (c) => {
  household(c.m[0]);
  const from = c.params.get("from") ?? today();
  const to = c.params.get("to") ?? addDays(from, 6);
  return st().planned
    .filter((p) => p.householdId === c.m[0] && p.date >= from && p.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.mealType - b.mealType)
    .map(plannedDto);
});

route("POST", "/households/:h/planned-meals", (c) => {
  const h = household(c.m[0]);
  const recipe = c.body.recipeId ? recipeOrThrow(c.body.recipeId) : null;
  const pm: PlannedMeal = {
    plannedMealId: nextId("pm"), householdId: h.householdId, date: c.body.date, mealType: Number(c.body.mealType ?? 1),
    recipeId: recipe?.id ?? null, title: c.body.title || recipe?.title || "—", servings: Number(c.body.servings ?? recipe?.servings ?? h.members.length),
    participantMemberIds: h.members.map((m) => m.memberId), notes: null, status: 0, mealId: null,
  };
  st().planned.push(pm);
  log(h.householdId, "PlannedMealCreated", "PlannedMeal", pm.plannedMealId, { title: txt(pm.title), recipeId: pm.recipeId });
  return plannedDto(pm);
});

route("PATCH", "/households/:h/planned-meals/:p", (c) => {
  const pm = plannedMeal(c.m[0], c.m[1]);
  if (Array.isArray(c.body.participantMemberIds)) pm.participantMemberIds = c.body.participantMemberIds.map(String);
  return plannedDto(pm);
});

route("DELETE", "/households/:h/planned-meals/:p", (c) => {
  const pm = plannedMeal(c.m[0], c.m[1]);
  st().planned = st().planned.filter((x) => x !== pm);
  log(c.m[0], "PlannedMealRemoved", "PlannedMeal", pm.plannedMealId, { title: txt(pm.title) });
});

route("POST", "/households/:h/planned-meals/:p/skip", (c) => {
  const pm = plannedMeal(c.m[0], c.m[1]);
  pm.status = 2;
  log(c.m[0], "PlannedMealSkipped", "PlannedMeal", pm.plannedMealId, { title: txt(pm.title) });
  return plannedDto(pm);
});

route("POST", "/households/:h/planned-meals/:p/unskip", (c) => {
  const pm = plannedMeal(c.m[0], c.m[1]);
  pm.status = 0;
  log(c.m[0], "PlannedMealUnskipped", "PlannedMeal", pm.plannedMealId, { title: txt(pm.title) });
  return plannedDto(pm);
});

route("POST", "/households/:h/planned-meals/:p/cook", (c) => {
  const pm = plannedMeal(c.m[0], c.m[1]);
  if (pm.status === 1) return { plannedMeal: plannedDto(pm) };
  const recipe = pm.recipeId ? recipeById.get(pm.recipeId) : undefined;
  if (recipe && c.body.consumePantry !== false) {
    for (const ing of checkRecipe(c.m[0], recipe, pm.servings)) consumeIngredient(c.m[0], ing.ingredientId, ing.required);
  }
  const mealId = logMeal(c.m[0], pm.date, pm.mealType, pm.recipeId, pm.title, pm.servings);
  pm.status = 1;
  pm.mealId = mealId;
  const leftovers = Math.max(0, Math.min(Number(c.body.leftoverServings ?? 0), pm.servings - 1));
  if (recipe && leftovers > 0) {
    st().pantry.push({
      pantryItemId: nextId("pi"), householdId: c.m[0], productId: LEFTOVER_PREFIX + recipe.id, quantity: { amount: leftovers, unit: U.un },
      location: 1, state: 1, purchasedAt: nowIso(), expiresAt: addDays(today(), 3), openedAt: nowIso(), purchasedPrice: null, scanned: null,
      sourceMealId: mealId, chainId: null, physicalStoreId: null, priceSource: null, initialAmount: leftovers, endedAt: null, discardReason: null,
    });
  }
  log(c.m[0], "PlannedMealCooked", "PlannedMeal", pm.plannedMealId, { title: txt(pm.title), recipeId: pm.recipeId });
  return { plannedMeal: plannedDto(pm) };
});

function lastCooked(householdId: string, recipeId: string): string | null {
  const dates = st().meals.filter((m) => m.householdId === householdId && m.recipeId === recipeId).map((m) => m.date).sort();
  return dates.length ? `${dates[dates.length - 1]}T20:00:00Z` : null;
}

function avoidedBy(h: Household, r: DemoRecipe) {
  const out: { ingredientId: string; name: string; severity: "Avoid" | "Limit"; memberIds: string[] }[] = [];
  for (const ing of r.ingredients) {
    if (ing.optional) continue;
    const who = h.members.filter((m) => (st().avoided[m.memberId] ?? []).some((a) => a.ingredientId === ing.ingredientId));
    if (!who.length) continue;
    const severity = who.some((m) => st().avoided[m.memberId].find((a) => a.ingredientId === ing.ingredientId)!.severity === "Avoid") ? "Avoid" : "Limit";
    out.push({ ...ingredientRef(ing.ingredientId), severity, memberIds: who.map((m) => m.memberId) });
  }
  return out;
}

route("GET", "/households/:h/planned-meals/suggestions", (c) => {
  const h = household(c.m[0]);
  const date = c.params.get("date") ?? today();
  const limit = num(c, "limit", 6);
  const stock = pantryStock(h.householdId);
  const soon = addDays(today(), 3);
  const list = recipes.filter((r) => r.dishType !== 5 && r.dishType !== 7).map((r) => {
    const checks = checkRecipe(h.householdId, r, r.servings, stock).filter((x) => !x.optional);
    const available = checks.filter((x) => x.available >= x.required - 1e-9);
    const partial = checks.filter((x) => x.available > 0 && x.available < x.required - 1e-9);
    const missing = checks.filter((x) => x.available <= 0 || x.available < x.required - 1e-9);
    const expiring = checks.filter((x) => x.available > 0 && x.expiresAt && x.expiresAt <= soon);
    const last = lastCooked(h.householdId, r.id);
    const plannedOn = st().planned.filter((p) => p.householdId === h.householdId && p.recipeId === r.id && p.status === 0 && p.date >= today()).map((p) => p.date);
    const avoided = avoidedBy(h, r);
    const restrictions = h.members.flatMap((m) => restrictionChecks(m, r));
    const reasons: number[] = [];
    if (available.length) reasons.push(0);
    if (expiring.length) reasons.push(1);
    if (last && last.slice(0, 10) >= addDays(date, -5)) reasons.push(2);
    if (plannedOn.length) reasons.push(3);
    if (restrictions.some((x) => x.result === 2)) reasons.push(4);
    if (avoided.length) reasons.push(5);
    const score = round2(available.length / checks.length + expiring.length * 0.3 - (reasons.includes(2) ? 0.4 : 0) - (plannedOn.length ? 0.3 : 0) - avoided.length * 0.2);
    return {
      recipeId: r.id, title: tx(r.title), servings: r.servings, score, ingredientCount: checks.length, availableCount: available.length,
      partialCount: partial.length, missingIngredients: missing.map((x) => ingredientRef(x.ingredientId)),
      expiringIngredients: expiring.map((x) => ({ ...ingredientRef(x.ingredientId), expiresAt: x.expiresAt! })),
      lastCookedAt: last, plannedOn, restrictions: restrictions.some((x) => x.result === 0) ? 0 : restrictions.some((x) => x.result === 2) ? 2 : 1,
      reasons, avoided: avoided.length ? { avoidedBy: avoided } : null,
    };
  });
  list.sort((a, b) => b.score - a.score);
  return { date, candidateCount: list.length, suggestions: list.slice(0, limit) };
});

/** Required amounts per ingredient for the planned meals in a range. */
function planNeeds(householdId: string, from: string, to: string, includeOptional = false) {
  const meals = st().planned.filter((p) => p.householdId === householdId && p.date >= from && p.date <= to && p.status === 0 && p.recipeId);
  const needs = new Map<string, number>();
  for (const pm of meals) {
    const recipe = recipeById.get(pm.recipeId!);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      if (ing.optional && !includeOptional) continue;
      const amount = toBase(ing.ingredientId, { amount: ing.amount * (pm.servings / recipe.servings), unit: ing.unit });
      needs.set(ing.ingredientId, (needs.get(ing.ingredientId) ?? 0) + amount);
    }
  }
  const skipped = st().planned.filter((p) => p.householdId === householdId && p.date >= from && p.date <= to && p.status === 2).map((p) => p.plannedMealId);
  return { meals, needs, skipped };
}

route("GET", "/households/:h/planned-meals/availability", (c) => {
  household(c.m[0]);
  const from = c.params.get("from") ?? today();
  const to = c.params.get("to") ?? addDays(from, 6);
  const { meals, needs, skipped } = planNeeds(c.m[0], from, to);
  const stock = pantryStock(c.m[0]);
  const lines = [...needs.entries()].map(([ingredientId, required]) => {
    const available = Math.min(required, stock.get(ingredientId)?.amount ?? 0);
    const missing = Math.max(0, required - available);
    return {
      ingredientId, label: ingredientRef(ingredientId).name, unit: baseUnit(ingredientId), required: round2(required), available: round2(available),
      missing: round2(missing), status: missing <= 1e-9 ? 2 : available > 0 ? 1 : 0, nominalQuantity: false, hasUncomparableStock: false,
    };
  }).sort((a, b) => a.status - b.status || a.label.localeCompare(b.label));
  return { from, to, plannedMealCount: meals.length, skippedPlannedMealIds: skipped, verdict: lines.some((l) => l.status !== 2) ? 1 : 0, lines };
});

route("POST", "/households/:h/planned-meals/from-template", (c) => {
  const h = household(c.m[0]);
  const t = findTemplate(c.body.mealPlanTemplateId);
  const start = c.body.startDate as string;
  const policy = Number(c.body.conflictPolicy ?? 0);
  const skipTypes: number[] = c.body.skipMealTypes ?? [];
  const servingsOverride = c.body.servings ?? null;
  const created: PlannedMeal[] = [];
  const skippedMeals: { date: string; mealType: number; reason: 0 | 1 }[] = [];
  let removed = 0;
  const entries = t.entries.filter((e) => !skipTypes.includes(e.mealType));
  if (policy === 2) {
    const conflict = entries.some((e) => st().planned.some((p) => p.householdId === h.householdId && p.date === addDays(start, e.dayIndex) && p.mealType === e.mealType));
    if (conflict) throw new DemoHttpError(409, "planned-meal-conflict");
  }
  for (const e of entries) {
    const date = addDays(start, e.dayIndex);
    const existing = st().planned.filter((p) => p.householdId === h.householdId && p.date === date && p.mealType === e.mealType);
    if (existing.length) {
      if (policy === 0) { skippedMeals.push({ date, mealType: e.mealType, reason: 0 }); continue; }
      if (existing.some((p) => p.status === 1)) { skippedMeals.push({ date, mealType: e.mealType, reason: 1 }); continue; }
      st().planned = st().planned.filter((p) => !existing.includes(p));
      removed += existing.length;
    }
    const recipe = recipeById.get(e.recipeId)!;
    const servings = servingsOverride ?? e.servings;
    const pm: PlannedMeal = {
      plannedMealId: nextId("pm"), householdId: h.householdId, date, mealType: e.mealType, recipeId: e.recipeId, title: recipe.title,
      servings, participantMemberIds: h.members.map((m) => m.memberId), notes: null, status: 0, mealId: null,
    };
    st().planned.push(pm);
    created.push(pm);
  }
  const warnings = [...new Set(created.map((p) => p.recipeId!))].flatMap((recipeId) => {
    const recipe = recipeById.get(recipeId)!;
    const who = h.members.filter((m) => restrictionChecks(m, recipe).some((x) => x.result === 0) || avoidedMatches(m.memberId, recipe).matches.some((x) => x.result === "Conflict"));
    return who.length ? [{ recipeId, title: tx(recipe.title), dates: created.filter((p) => p.recipeId === recipeId).map((p) => p.date), members: who.map((m) => ({ memberId: m.memberId, name: m.name })) }] : [];
  });
  log(h.householdId, "PlannedMealCreated", "PlannedMeal", created[0]?.plannedMealId ?? "", { title: t.name });
  return {
    mealPlanTemplateId: t.mealPlanTemplateId, from: start, to: addDays(start, t.durationDays - 1), createdCount: created.length, removedCount: removed,
    plannedMeals: created.map(plannedDto), skippedMeals, skippedEntries: [], restrictionWarnings: warnings,
  };
});

/** Adds what is missing for `needs` to a list, net of pantry and of what the list already has. */
function addNeedsToList(list: ShoppingList, needs: Map<string, number>, sourceRecipeId: string | null, onlyMissing: boolean) {
  const stock = pantryStock(list.householdId);
  let added = 0;
  let covered = 0;
  for (const [ingredientId, required] of needs) {
    const fromPantry = onlyMissing ? stock.get(ingredientId)?.amount ?? 0 : 0;
    const inList = list.items
      .filter((i) => !i.isPurchased && (i.ingredientId === ingredientId || (i.productId && productFor(i.productId)?.ingredientId === ingredientId)))
      .reduce((a, i) => a + toBase(ingredientId, i.quantity), 0);
    const missing = required - fromPantry;
    if (missing <= 1e-9) continue;
    if (inList >= missing - 1e-9) { covered += 1; continue; }
    const unit = baseUnit(ingredientId);
    let amount = missing - inList;
    amount = unit === U.un ? Math.ceil(amount - 1e-9) : Math.ceil(amount / 10) * 10;
    list.items.push(newListItem({ label: ingredientRef(ingredientId).name, ingredientId, sourceRecipeId, quantity: { amount, unit } }));
    added += 1;
  }
  touch(list);
  return { added, covered };
}

route("POST", "/households/:h/planned-meals/shopping-list", (c) => {
  const list = getList(c.m[0], c.body.shoppingListId);
  const { meals, needs, skipped } = planNeeds(c.m[0], c.body.from, c.body.to, !!c.body.includeOptional);
  const { added, covered } = addNeedsToList(list, needs, null, c.body.onlyMissing !== false);
  log(c.m[0], "ShoppingListItemAdded", "ShoppingList", list.shoppingListId, { name: txt(list.name) });
  return { shoppingList: listDto(list), plannedMealCount: meals.length, addedItemCount: added, skippedPlannedMealIds: skipped, coveredByListCount: covered };
});

// -------------------------------------------------------------- shopping

const listStatusByName: Record<string, number> = { Open: 0, Completed: 1, Cancelled: 2 };

route("GET", "/households/:h/shopping-lists", (c) => {
  household(c.m[0]);
  const status = c.params.get("status");
  const list = st().lists
    .filter((l) => l.householdId === c.m[0] && (!status || l.status === listStatusByName[status]))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((l) => ({ shoppingListId: l.shoppingListId, name: txt(l.name), status: l.status, itemCount: l.items.length, purchasedItemCount: l.items.filter((i) => i.isPurchased).length }));
  return paged(list, c, 50);
});

route("POST", "/households/:h/shopping-lists", (c) => {
  household(c.m[0]);
  const day = (locale: string) => new Date().toLocaleDateString(locale, { day: "numeric", month: "long" });
  const list: ShoppingList = {
    shoppingListId: nextId("sl"), householdId: c.m[0], name: c.body.name?.trim() || { pt: `Lista de ${day("pt-PT")}`, en: `List for ${day("en-GB")}` },
    status: 0, createdAt: nowIso(), updatedAt: nowIso(), completedAt: null, chainId: null, physicalStoreId: null, plan: null, items: [],
  };
  st().lists.push(list);
  log(c.m[0], "ShoppingListCreated", "ShoppingList", list.shoppingListId, { name: txt(list.name) });
  return listDto(list);
});

route("GET", "/households/:h/shopping-lists/:l", (c) => listDto(getList(c.m[0], c.m[1])));

route("PATCH", "/households/:h/shopping-lists/:l", (c) => {
  const list = getList(c.m[0], c.m[1]);
  if (c.body.name) list.name = c.body.name;
  touch(list);
  return listDto(list);
});

route("POST", "/households/:h/shopping-lists/:l/items", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = newListItem({ label: c.body.label, quantity: c.body.quantity, productId: c.body.productId ?? null, ingredientId: c.body.ingredientId ?? null });
  list.items.push(item);
  touch(list);
  log(c.m[0], "ShoppingListItemAdded", "ShoppingList", list.shoppingListId, { label: item.label });
  return listDto(list);
});

route("PUT", "/households/:h/shopping-lists/:l/items/order", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const order: string[] = c.body.itemIds ?? [];
  list.items.sort((a, b) => order.indexOf(a.shoppingListItemId) - order.indexOf(b.shoppingListItemId));
  touch(list);
});

route("POST", "/households/:h/shopping-lists/:l/items/from-recipe", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const recipe = recipeOrThrow(c.body.recipeId);
  const servings = c.body.servings ?? recipe.servings;
  const needs = new Map<string, number>();
  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;
    needs.set(ing.ingredientId, (needs.get(ing.ingredientId) ?? 0) + toBase(ing.ingredientId, { amount: ing.amount * (servings / recipe.servings), unit: ing.unit }));
  }
  addNeedsToList(list, needs, recipe.id, !!c.body.onlyMissing);
  if (!st().saved.some((s) => s.householdId === c.m[0] && s.recipeId === recipe.id)) {
    st().saved.push({ householdId: c.m[0], recipeId: recipe.id, origin: 1, savedAt: nowIso() });
  }
  log(c.m[0], "ShoppingListItemAdded", "ShoppingList", list.shoppingListId, { title: tx(recipe.title) });
  return listDto(list);
});

route("PATCH", "/households/:h/shopping-lists/:l/items/:i", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = getItem(list, c.m[2]);
  if (c.body.productId) { item.productId = c.body.productId; item.ingredientId = productFor(c.body.productId)?.ingredientId ?? null; }
  else if (c.body.ingredientId) { item.ingredientId = c.body.ingredientId; item.productId = null; }
  touch(list);
  log(c.m[0], "ShoppingListItemUpdated", "ShoppingList", list.shoppingListId, { label: txt(item.label) });
  return listDto(list);
});

route("DELETE", "/households/:h/shopping-lists/:l/items/:i", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = getItem(list, c.m[2]);
  list.items = list.items.filter((i) => i !== item);
  touch(list);
  log(c.m[0], "ShoppingListItemRemoved", "ShoppingList", list.shoppingListId, { label: txt(item.label) });
});

function recordPurchase(list: ShoppingList, item: ListItem) {
  if (!item.productId) return;
  const eff = effectiveChain(list, item);
  const paid = itemPaid(list, item);
  st().purchases.push({
    householdId: list.householdId, date: item.purchasedAt!, chainId: eff.chainId, physicalStoreId: eff.physicalStoreId, productId: item.productId,
    quantity: item.quantity, paid: paid.price, source: paid.source,
  });
}

function dropPurchase(list: ShoppingList, item: ListItem) {
  st().purchases = st().purchases.filter((p) => !(p.householdId === list.householdId && p.productId === item.productId && p.date === item.purchasedAt));
}

route("POST", "/households/:h/shopping-lists/:l/items/:i/purchase", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = getItem(list, c.m[2]);
  item.isPurchased = true;
  item.purchasedAt = nowIso();
  if (c.body?.chainId) { item.boughtChainId = c.body.chainId; item.boughtPhysicalStoreId = c.body.physicalStoreId ?? null; }
  recordPurchase(list, item);
  touch(list);
  log(c.m[0], "ShoppingListItemPurchased", "ShoppingList", list.shoppingListId, { label: txt(item.label) });
});

route("POST", "/households/:h/shopping-lists/:l/items/:i/unpurchase", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = getItem(list, c.m[2]);
  dropPurchase(list, item);
  item.isPurchased = false;
  item.purchasedAt = null;
  item.boughtChainId = null;
  item.boughtPhysicalStoreId = null;
  item.typedPrice = null;
  touch(list);
  log(c.m[0], "ShoppingListItemUnpurchased", "ShoppingList", list.shoppingListId, { label: txt(item.label) });
});

for (const [action, status, eventType] of [["complete", 1, "ShoppingListCompleted"], ["cancel", 2, "ShoppingListCancelled"], ["reopen", 0, "ShoppingListReopened"]] as const) {
  route("POST", `/households/:h/shopping-lists/:l/${action}`, (c) => {
    const list = getList(c.m[0], c.m[1]);
    list.status = status;
    list.completedAt = status === 1 ? nowIso() : null;
    touch(list);
    log(c.m[0], eventType, "ShoppingList", list.shoppingListId, { name: txt(list.name) });
  });
}

route("PUT", "/households/:h/shopping-lists/:l/store", (c) => {
  const list = getList(c.m[0], c.m[1]);
  list.chainId = c.body.chainId ?? null;
  list.physicalStoreId = c.body.chainId ? c.body.physicalStoreId ?? null : null;
  touch(list);
  return listDto(list);
});

route("PUT", "/households/:h/shopping-lists/:l/items/:i/store", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = getItem(list, c.m[2]);
  item.chainId = c.body.chainId ?? null;
  item.physicalStoreId = c.body.chainId ? c.body.physicalStoreId ?? null : null;
  touch(list);
  return listDto(list);
});

route("PUT", "/households/:h/shopping-lists/:l/items/:i/paid-price", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const item = getItem(list, c.m[2]);
  dropPurchase(list, item);
  item.typedPrice = c.body.amount ?? null;
  if (item.isPurchased) recordPurchase(list, item);
  touch(list);
  return listDto(list);
});

route("PUT", "/households/:h/shopping-lists/:l/plan", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const b = c.body;
  list.chainId = b.list.chainId;
  list.physicalStoreId = b.list.physicalStoreId ?? null;
  list.plan = { plannedAt: nowIso(), chainId: b.list.chainId, physicalStoreId: b.list.physicalStoreId ?? null, travelCost: b.travelCost ?? null };
  const overrides = new Map<string, { chainId: string; physicalStoreId: string | null }>((b.items ?? []).map((i: { itemId: string; chainId: string; physicalStoreId: string | null }) => [i.itemId, i]));
  for (const item of list.items) {
    if (item.isPurchased) continue;
    const o = overrides.get(item.shoppingListItemId);
    item.chainId = o?.chainId ?? null;
    item.physicalStoreId = o?.physicalStoreId ?? null;
    const chainId = o?.chainId ?? b.list.chainId;
    const priced = priceItemAt(item, chainId);
    item.plannedChainId = chainId;
    item.plannedPhysicalStoreId = o ? o.physicalStoreId : b.list.physicalStoreId ?? null;
    item.plannedPrice = priced?.lineTotal ?? null;
  }
  touch(list);
  return listDto(list);
});

route("DELETE", "/households/:h/shopping-lists/:l/plan", (c) => {
  const list = getList(c.m[0], c.m[1]);
  for (const item of list.items) {
    if (item.isPurchased) continue;
    item.plannedChainId = null;
    item.plannedPhysicalStoreId = null;
    item.plannedPrice = null;
  }
  if (!list.items.some((i) => i.plannedChainId)) list.plan = null;
  touch(list);
  return listDto(list);
});

route("GET", "/households/:h/shopping-lists/:l/packaging", (c) => {
  const list = getList(c.m[0], c.m[1]);
  return {
    items: list.items.filter((i) => i.productId && productFor(i.productId)).map((i) => {
      const product = productFor(i.productId!)!;
      return { shoppingListItemId: i.shoppingListItemId, productId: product.id, productName: tx(product.name), packageQuantity: product.qty, packageUnit: product.unit, packageCount: packagesFor(i) };
    }),
  };
});

route("POST", "/households/:h/shopping-lists/:l/store-in-pantry", (c) => {
  const list = getList(c.m[0], c.m[1]);
  const ids: string[] | null = c.body.itemIds ?? null;
  const location = Number(c.body.location ?? 0);
  const skipped: { shoppingListItemId: string; label: string }[] = [];
  let stored = 0;
  for (const item of list.items) {
    if (!item.isPurchased || item.storedInPantryAt) continue;
    if (ids && !ids.includes(item.shoppingListItemId)) continue;
    const productId = item.productId ?? (item.ingredientId ? genericProductFor(item.ingredientId)?.id : undefined);
    if (!productId) { skipped.push({ shoppingListItemId: item.shoppingListItemId, label: txt(item.label) }); continue; }
    const product = productFor(productId)!;
    const eff = effectiveChain(list, item);
    const paid = itemPaid(list, item);
    const packs = packagesFor({ ...item, productId });
    const quantity = item.productId ? { amount: product.qty * packs, unit: product.unit } : item.quantity;
    const pi: PantryItem = {
      pantryItemId: nextId("pi"), householdId: list.householdId, productId, quantity, location, state: location === 2 ? 2 : 0,
      purchasedAt: item.purchasedAt ?? nowIso(), expiresAt: addDays(today(), product.categoryId === "c-frescos" || product.categoryId === "c-talho" ? 6 : product.categoryId === "c-laticinios" ? 12 : 180),
      openedAt: null, purchasedPrice: paid.price, scanned: null, sourceMealId: null, chainId: eff.chainId, physicalStoreId: eff.physicalStoreId,
      priceSource: paid.source, initialAmount: quantity.amount, endedAt: null, discardReason: null,
    };
    st().pantry.push(pi);
    item.storedInPantryAt = nowIso();
    stored += 1;
    log(list.householdId, "PantryItemAdded", "PantryItem", pi.pantryItemId, { productId, name: tx(product.name) });
  }
  touch(list);
  return { shoppingList: listDto(list), storedCount: stored, skipped };
});

/** Price of one list item at a chain: best product for it and package count. */
function priceItemAt(item: ListItem, chainId: string) {
  const chain = chainById.get(chainId);
  if (!chain) return null;
  const candidates = item.productId ? [productFor(item.productId)!].filter(Boolean) : item.ingredientId ? products.filter((p) => p.ingredientId === item.ingredientId && !p.discontinued) : [];
  let best: null | { offer: Offer; packageCount: number; lineTotal: number; cardLineTotal: number; converted: boolean; requiredAmount: number; requiredUnit: number } = null;
  for (const product of candidates) {
    const offer = offerFor(product, chain);
    if (!offer) continue;
    const ingredientId = product.ingredientId ?? item.ingredientId;
    const requiredUnit = item.quantity.unit === U.un ? U.un : item.quantity.unit === U.kg || item.quantity.unit === U.g ? U.g : U.ml;
    const requiredAmount = item.quantity.unit === U.un ? item.quantity.amount : toGrams(ingredientId, item.quantity);
    let packageCount: number;
    let converted = false;
    if (product.unit === U.un) {
      packageCount = item.quantity.unit === U.un ? Math.ceil(item.quantity.amount / product.qty - 1e-9) : 1;
      converted = item.quantity.unit !== U.un;
    } else {
      const pack = toGrams(ingredientId, { amount: product.qty, unit: product.unit });
      const need = item.quantity.unit === U.un ? toGrams(ingredientId, item.quantity) : requiredAmount;
      converted = item.quantity.unit === U.un;
      packageCount = Math.ceil(need / pack - 1e-9);
    }
    packageCount = Math.max(1, packageCount);
    const lineTotal = round2(offer.price * packageCount);
    const card = cardPrice(offer);
    const cardLineTotal = round2((card ?? offer.price) * packageCount);
    if (!best || lineTotal < best.lineTotal) best = { offer, packageCount, lineTotal, cardLineTotal, converted, requiredAmount, requiredUnit };
  }
  return best;
}

route("GET", "/households/:h/shopping-lists/:l/store-comparison", (c) => {
  const h = household(c.m[0]);
  const list = getList(c.m[0], c.m[1]);
  const open = list.items.filter((i) => !i.isPurchased);
  const unpriced = open.filter((i) => !i.productId && !i.ingredientId).map((i) => ({ itemId: i.shoppingListItemId, label: txt(i.label), reason: 0 }));
  const priceable = open.filter((i) => i.productId || i.ingredientId);
  const notSold = priceable.filter((i) => chains.every((ch) => !priceItemAt(i, ch.id)));
  unpriced.push(...notSold.map((i) => ({ itemId: i.shoppingListItemId, label: txt(i.label), reason: 1 })));
  const items = priceable.filter((i) => !notSold.includes(i));

  const wantTravel = c.params.get("includeTravel") === "true";
  const origin = originFrom(c);
  const radiusKm = h.maxStoreDistanceKm ?? 10;
  const costPerKm = h.travelCostPerKm ?? 0.25;
  const near = wantTravel ? nearby(h, origin, radiusKm) : [];

  const stores = chains.map((chain) => {
    const lines = items.map((item) => ({ item, priced: priceItemAt(item, chain.id) })).filter((x) => x.priced);
    const total = round2(lines.reduce((a, x) => a + x.priced!.lineTotal, 0));
    const cardTotal = round2(lines.reduce((a, x) => a + x.priced!.cardLineTotal, 0));
    const nearest = near.find((s) => s.chainId === chain.id) ?? null;
    const travelCost = wantTravel && nearest ? round2(nearest.roundTripKm * costPerKm) : null;
    return {
      storeId: chain.storeId, storeName: storeName(chain), chainId: chain.id, chainName: chain.name, coveredItemCount: lines.length, total, cardTotal,
      missingItemIds: items.filter((i) => !lines.some((x) => x.item === i)).map((i) => i.shoppingListItemId),
      items: lines.map(({ item, priced }) => ({
        itemId: item.shoppingListItemId, itemIds: [item.shoppingListItemId], label: txt(item.label),
        requiredAmount: round2(priced!.requiredAmount), requiredUnit: priced!.requiredUnit,
        productId: priced!.offer.product.id, productName: tx(priced!.offer.product.name), packageQuantity: priced!.offer.product.qty,
        packageUnit: priced!.offer.product.unit, packageCount: priced!.packageCount, quantityComparable: true, quantityConverted: priced!.converted,
        missingConversion: null, packagePrice: priced!.offer.price, lineTotal: priced!.lineTotal, cardProductId: priced!.offer.product.id,
        cardLineTotal: priced!.cardLineTotal, observedAt: new Date().toISOString(),
      })),
      ...(wantTravel ? {
        nearestStore: nearest ? { physicalStoreId: nearest.physicalStoreId, name: nearest.name, address: nearest.address, roadKm: nearest.roadKm, roundTripKm: nearest.roundTripKm, openingHours: nearest.openingHours } : null,
        travelCost,
        totalWithTravel: travelCost === null ? null : round2(total + travelCost),
        cardTotalWithTravel: travelCost === null ? null : round2(cardTotal + travelCost),
      } : {}),
    };
  }).sort((a, b) => b.coveredItemCount - a.coveredItemCount || a.total - b.total);

  const best = stores[0];
  const splitItems = items.map((item) => {
    let choice: { storeId: string; productId: string; lineTotal: number; cardLineTotal: number; chainId: string } | null = null;
    for (const s of stores) {
      const line = s.items.find((x) => x.itemId === item.shoppingListItemId);
      if (line && (!choice || line.lineTotal < choice.lineTotal)) choice = { storeId: s.storeId, productId: line.productId, lineTotal: line.lineTotal, cardLineTotal: line.cardLineTotal, chainId: s.chainId };
    }
    return { item, choice: choice! };
  });
  const splitTotal = round2(splitItems.reduce((a, x) => a + x.choice.lineTotal, 0));
  const splitCard = round2(splitItems.reduce((a, x) => a + x.choice.cardLineTotal, 0));
  const bestCovered = (ids: string[]) => splitItems.filter((x) => !best?.missingItemIds.includes(x.item.shoppingListItemId) && ids.includes(x.item.shoppingListItemId));
  const comparable = bestCovered(items.map((i) => i.shoppingListItemId));
  const comparableSplit = comparable.reduce((a, x) => a + x.choice.lineTotal, 0);
  const comparableSplitCard = comparable.reduce((a, x) => a + x.choice.cardLineTotal, 0);
  const split = {
    coveredItemCount: splitItems.length,
    storeCount: new Set(splitItems.map((x) => x.choice.storeId)).size,
    total: splitTotal,
    cardTotal: splitCard,
    bestStoreId: best?.storeId ?? null,
    savingVsBestStore: best ? round2(Math.max(0, best.total - comparableSplit)) : 0,
    cardSavingVsBestStore: best ? round2(Math.max(0, best.cardTotal - comparableSplitCard)) : 0,
    items: splitItems.map((x) => ({ itemId: x.item.shoppingListItemId, itemIds: [x.item.shoppingListItemId], storeId: x.choice.storeId, productId: x.choice.productId, lineTotal: x.choice.lineTotal })),
  };

  let splitWithTravel = null;
  if (wantTravel && near.length) {
    const chainsUsed = [...new Set(splitItems.map((x) => x.choice.chainId))];
    const stops = chainsUsed.map((id) => near.find((s) => s.chainId === id)).filter((s): s is NonNullable<typeof s> => !!s);
    if (stops.length === chainsUsed.length) {
      let routeKm = 0;
      let at = origin;
      for (const s of stops) {
        const ps = physicalStoreById.get(s.physicalStoreId)!;
        routeKm += distanceKm(at, ps.lat, ps.lng) * ROAD_FACTOR;
        at = { latitude: ps.lat, longitude: ps.lng };
      }
      routeKm += distanceKm(at, origin.latitude, origin.longitude) * ROAD_FACTOR;
      const travelCost = round2(routeKm * costPerKm);
      const splitWithTravelTotal = round2(splitTotal + travelCost);
      const bestWithTravel = best?.totalWithTravel ?? null;
      if (bestWithTravel !== null && bestWithTravel <= splitWithTravelTotal && best!.coveredItemCount === items.length) {
        const bestNear = best!.nearestStore!;
        splitWithTravel = {
          coveredItemCount: best!.coveredItemCount, storeCount: 1, total: best!.total, cardTotal: best!.cardTotal, bestStoreId: best!.storeId,
          savingVsBestStore: 0, cardSavingVsBestStore: 0,
          items: best!.items.map((x) => ({ itemId: x.itemId, itemIds: x.itemIds, storeId: best!.storeId, productId: x.productId, lineTotal: x.lineTotal })),
          route: [bestNear.physicalStoreId], routeKm: bestNear.roundTripKm, travelCost: best!.travelCost!, totalWithTravel: bestWithTravel, cardTotalWithTravel: best!.cardTotalWithTravel!,
        };
      } else {
        splitWithTravel = {
          ...split, route: stops.map((s) => s.physicalStoreId), routeKm: round2(routeKm), travelCost,
          totalWithTravel: splitWithTravelTotal, cardTotalWithTravel: round2(splitCard + travelCost),
        };
      }
    }
  }

  return {
    shoppingListId: list.shoppingListId, currency: "EUR", itemCount: open.length, unpricedItems: unpriced, stores, split,
    ...(wantTravel ? { splitWithTravel, travel: { status: near.length ? "Included" : "NoStoresInRange", origin, costPerKm, roadFactor: ROAD_FACTOR, radiusKm } } : {}),
  };
});

// -------------------------------------------------------------- spending

route("GET", "/households/:h/spending", (c) => {
  household(c.m[0]);
  const to = c.params.get("to") ?? today();
  const fromDefault = (() => { const d = new Date(); d.setMonth(d.getMonth() - 5, 1); return d.toISOString().slice(0, 10); })();
  const from = c.params.get("from") ?? fromDefault;
  const list = st().purchases.filter((p) => p.householdId === c.m[0] && p.date.slice(0, 10) >= from && p.date.slice(0, 10) <= to);
  const sumOf = (xs: typeof list) => {
    const priced = xs.filter((x) => x.paid !== null);
    const typed = round2(priced.filter((x) => x.source === "Typed").reduce((a, x) => a + x.paid!, 0));
    const estimated = round2(priced.filter((x) => x.source !== "Typed").reduce((a, x) => a + x.paid!, 0));
    return { total: round2(typed + estimated), typed, estimated, withoutPrice: xs.length - priced.length };
  };
  const months: string[] = [];
  for (let d = new Date(`${from.slice(0, 7)}-01T12:00:00Z`); d.toISOString().slice(0, 7) <= to.slice(0, 7); d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 7));
  const all = sumOf(list);
  return {
    from, to, currency: "EUR", total: all.total, typed: all.typed, estimated: all.estimated, purchasesWithoutPrice: all.withoutPrice,
    months: months.map((month) => {
      const xs = list.filter((p) => p.date.slice(0, 7) === month);
      const s = sumOf(xs);
      const chainIds = [...new Set(xs.map((x) => x.chainId))];
      return {
        month, total: s.total, typed: s.typed, estimated: s.estimated, purchasesWithoutPrice: s.withoutPrice,
        chains: chainIds.map((chainId) => {
          const cs = sumOf(xs.filter((x) => x.chainId === chainId));
          return { chainId, chainName: chainId ? chainById.get(chainId)?.name ?? null : null, total: cs.total, typed: cs.typed, estimated: cs.estimated, purchases: xs.filter((x) => x.chainId === chainId).length };
        }).sort((a, b) => b.total - a.total),
      };
    }),
  };
});

route("GET", "/households/:h/products/:p/purchases", (c) => {
  household(c.m[0]);
  const limit = num(c, "limit", 10);
  return {
    items: st().purchases
      .filter((p) => p.householdId === c.m[0] && p.productId === c.m[1])
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit)
      .map((p) => ({
        purchasedAt: p.date, chainId: p.chainId, chainName: p.chainId ? chainById.get(p.chainId)?.name ?? null : null,
        physicalStoreId: p.physicalStoreId, physicalStoreName: p.physicalStoreId ? physicalStoreById.get(p.physicalStoreId)?.name ?? null : null,
        quantity: p.quantity, paidPrice: money(p.paid), paidPriceSource: p.source,
      })),
  };
});

// ------------------------------------------------------------- nutrition

const NUTRIENTS = ["energyKcal", "protein", "carbs", "sugar", "fat", "saturates", "fiber", "salt"] as const;
type Nutrients = Record<(typeof NUTRIENTS)[number], number>;
const zero = (): Nutrients => ({ energyKcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, saturates: 0, fiber: 0, salt: 0 });
const REFERENCE: Omit<Nutrients, "fiber"> = { energyKcal: 2000, protein: 50, carbs: 260, sugar: 90, fat: 70, saturates: 20, salt: 6 };
const GOAL_KEY: Record<(typeof NUTRIENTS)[number], string> = { energyKcal: "energyKcal", protein: "proteinG", carbs: "carbsG", sugar: "sugarG", fat: "fatG", saturates: "saturatesG", fiber: "fiberG", salt: "saltG" };

function mealNutrients(meal: DemoState["meals"][number], portion: number | null): Nutrients | null {
  const recipe = meal.recipeId ? recipeById.get(meal.recipeId) : undefined;
  if (!recipe) return null;
  const per = recipeNutritionPerServing(recipe);
  const factor = portion === null ? meal.servings : portion;
  const out = zero();
  for (const k of NUTRIENTS) out[k] = round2(per[k] * factor);
  return out;
}

function goalPercent(memberId: string | null, n: Nutrients, days: number) {
  if (!memberId) return null;
  const g = st().goals[memberId] as unknown as Record<string, number | null> | undefined;
  if (!g) return null;
  return Object.fromEntries(NUTRIENTS.map((k) => {
    const target = g[GOAL_KEY[k]];
    return [k, target ? round2((n[k] / days / target) * 100) : null];
  }));
}

function nutritionData(c: Ctx) {
  const h = household(c.m[0]);
  const from = c.params.get("from") ?? addDays(today(), -6);
  const to = c.params.get("to") ?? today();
  const memberId = c.params.get("memberId");
  const m = memberId ? member(h, memberId) : null;
  const meals = st().meals.filter((x) => x.householdId === h.householdId && x.date >= from && x.date <= to);
  return { h, from, to, memberId, m, meals };
}

route("GET", "/households/:h/nutrition/summary", (c) => {
  const { from, to, memberId, m, meals } = nutritionData(c);
  const portion = m ? m.defaultPortion : null;
  const total = zero();
  let covered = 0;
  const days = dateRange(from, to).map((date) => {
    const dayMeals = meals.filter((x) => x.date === date);
    const n = zero();
    let overFat = 0;
    for (const meal of dayMeals) {
      const mn = mealNutrients(meal, portion);
      if (!mn) continue;
      covered += 1;
      for (const k of NUTRIENTS) { n[k] = round2(n[k] + mn[k]); total[k] = round2(total[k] + mn[k]); }
      const maxFat = memberId ? st().goals[memberId]?.maxFatPerMealG : null;
      if (maxFat && mn.fat > maxFat) overFat += 1;
    }
    return {
      date, mealCount: dayMeals.length, nutrients: n,
      referenceIntakePercent: m ? Object.fromEntries(Object.entries(REFERENCE).map(([k, v]) => [k, round2((n[k as keyof Nutrients] / v) * 100)])) : null,
      goalIntakePercent: goalPercent(memberId, n, 1),
      mealsOverFatLimit: memberId && st().goals[memberId]?.maxFatPerMealG ? overFat : null,
    };
  });
  return {
    from, to, memberId, mealCount: meals.length, coveredItemCount: covered, uncoveredItemCount: meals.length - covered, total, days,
    goalIntakePercent: goalPercent(memberId, total, Math.max(1, days.length)),
  };
});

route("GET", "/households/:h/nutrition/score", (c) => {
  const { h, from, to, memberId, m, meals } = nutritionData(c);
  let source: number | null = 1;
  let list = meals.map((x) => ({ recipeId: x.recipeId, servings: x.servings }));
  if (!list.length) {
    source = 0;
    list = st().planned.filter((p) => p.householdId === h.householdId && p.date >= from && p.date <= to && p.status !== 2).map((p) => ({ recipeId: p.recipeId, servings: p.servings }));
  }
  if (!list.length) {
    return { from, to, memberId, source: null, score: null, unavailableReason: 0, coverage: 0, components: [], personalGoalsApplied: false };
  }
  const portion = m ? m.defaultPortion : null;
  const total = zero();
  let covered = 0;
  for (const x of list) {
    const mn = mealNutrients({ mealId: "", householdId: "", date: "", mealType: 0, title: "", recipeId: x.recipeId, servings: x.servings }, portion);
    if (!mn) continue;
    covered += 1;
    for (const k of NUTRIENTS) total[k] += mn[k];
  }
  const coverage = round2(covered / list.length);
  if (coverage < 0.5) return { from, to, memberId, source, score: null, unavailableReason: 1, coverage, components: [], personalGoalsApplied: false };
  const energy = total.energyKcal || 1;
  const proteinShare = (total.protein * 4) / energy;
  const balance = Math.max(0, 40 - Math.abs(proteinShare - 0.18) * 200);
  const satShare = (total.saturates * 9) / energy;
  const limits = Math.max(0, 30 - Math.max(0, satShare - 0.1) * 300 - Math.max(0, (total.salt / energy) * 2000 - 5) * 3);
  const fiberPer1000 = (total.fiber / energy) * 1000;
  const fiber = Math.min(15, fiberPer1000 * 1.1);
  const distinct = new Set(list.map((x) => x.recipeId)).size;
  const variety = Math.min(15, distinct * 2.5);
  const components = [
    { component: 0, points: Math.round(balance), maxPoints: 40, value: round2(proteinShare * 100) },
    { component: 1, points: Math.round(limits), maxPoints: 30, value: round2(satShare * 100) },
    { component: 2, points: Math.round(fiber), maxPoints: 15, value: round2(fiberPer1000) },
    { component: 3, points: Math.round(variety), maxPoints: 15, value: distinct },
  ];
  return {
    from, to, memberId, source, score: components.reduce((a, x) => a + x.points, 0), unavailableReason: null, coverage, components,
    personalGoalsApplied: !!(memberId && st().goals[memberId]),
  };
});

// As refeições registadas (para o ecrã "Refeição a refeição"): participam todos os membros da casa.
function demoMealDto(meal: DemoState["meals"][number], h: Household) {
  return {
    mealId: meal.mealId, title: txt(meal.title), mealType: meal.mealType, eatenAt: `${meal.date}T12:00:00Z`,
    servings: meal.servings, participantMemberIds: h.members.map((x) => x.memberId),
  };
}

route("GET", "/households/:h/meals", (c) => {
  const h = household(c.m[0]);
  const from = (c.params.get("from") ?? "0000-01-01").slice(0, 10);
  const to = (c.params.get("to") ?? "9999-12-31").slice(0, 10);
  const memberId = c.params.get("memberId");
  if (memberId) member(h, memberId);
  const list = st().meals
    .filter((x) => x.householdId === h.householdId && x.date >= from && x.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((x) => demoMealDto(x, h));
  return paged(list, c);
});

route("GET", "/households/:h/meals/:id/nutrition", (c) => {
  const h = household(c.m[0]);
  const meal = st().meals.find((x) => x.mealId === c.m[1] && x.householdId === h.householdId);
  if (!meal) throw notFound();
  const total = mealNutrients(meal, null) ?? zero();
  const portions = h.members.map((x) => x.defaultPortion);
  const sum = portions.reduce((a, b) => a + b, 0) || 1;
  const share = (portion: number) => Object.fromEntries(NUTRIENTS.map((k) => [k, round2((total[k] * portion) / sum)]));
  return {
    mealId: meal.mealId, total, perParticipant: h.members.length ? share(1) : null,
    coveredItemCount: mealNutrients(meal, null) ? 1 : 0, uncoveredItemCount: mealNutrients(meal, null) ? 0 : 1, items: [],
    perMember: h.members.map((x) => ({ memberId: x.memberId, portion: x.defaultPortion, nutrients: share(x.defaultPortion) })),
  };
});

// --------------------------------------------------------- opportunities

function buildOpportunities(h: Household) {
  const s = st();
  const now = new Date();
  const t0 = today();
  const out: Record<string, unknown>[] = [];
  const base = (id: string, critical: boolean, validUntil: string, expectedBenefit: number | null) => ({
    opportunityId: id, householdId: h.householdId, expectedBenefit, currency: expectedBenefit === null ? null : "EUR", critical, validUntil,
    status: s.opportunityStatus[id] ?? 0, presentedAt: now.toISOString(), createdAt: new Date(now.getTime() - 3_600_000).toISOString(),
  });

  // Expiring pantry items.
  const expiring = s.pantry
    .filter((i) => i.householdId === h.householdId && inStock(i) && i.expiresAt && i.expiresAt <= addDays(t0, 2) && i.expiresAt >= addDays(t0, -1))
    .sort((a, b) => a.expiresAt!.localeCompare(b.expiresAt!))
    .slice(0, 3);
  for (const item of expiring) {
    const name = pantryName(item);
    const days = Math.round((Date.parse(item.expiresAt!) - Date.parse(t0)) / 86_400_000);
    const when = days < 0 ? tx({ pt: "já passou da validade", en: "is past its date" }) : days === 0 ? tx({ pt: "acaba hoje", en: "expires today" }) : days === 1 ? tx({ pt: "acaba amanhã", en: "expires tomorrow" }) : tx({ pt: `acaba em ${days} dias`, en: `expires in ${days} days` });
    out.push({
      ...base(`op-exp-${item.pantryItemId}`, days <= 0, `${item.expiresAt}T23:59:00Z`, item.purchasedPrice),
      type: 0, title: `${name} ${when}`,
      explanation: tx({ pt: "Usa-o numa refeição ou congela antes que se estrague.", en: "Use it in a meal or freeze it before it goes off." }),
      payload: { pantryItemId: item.pantryItemId, productId: item.productId, expiresAt: item.expiresAt },
    });
  }

  // Next planned meal with missing ingredients.
  const stock = pantryStock(h.householdId);
  const next = s.planned
    .filter((p) => p.householdId === h.householdId && p.status === 0 && p.recipeId && p.date >= t0 && p.date <= addDays(t0, 3))
    .sort((a, b) => a.date.localeCompare(b.date) || a.mealType - b.mealType)
    .map((p) => ({ p, missing: checkRecipe(h.householdId, recipeById.get(p.recipeId!)!, p.servings, stock).filter((x) => !x.optional && x.available < x.required - 1e-9) }))
    .find((x) => x.missing.length);
  if (next) {
    out.push({
      ...base(`op-plan-${next.p.plannedMealId}`, next.p.date === t0, `${next.p.date}T21:00:00Z`, null),
      type: 1, title: tx({ pt: `Faltam ingredientes para ${txt(next.p.title)}`, en: `Missing ingredients for ${txt(next.p.title)}` }),
      explanation: next.missing.map((x) => ingredientRef(x.ingredientId).name).join(", "),
      payload: { plannedMealId: next.p.plannedMealId, recipeId: next.p.recipeId, date: next.p.date, missing: next.missing.map((x) => ingredientRef(x.ingredientId)) },
    });
  }

  // Good prices on what the household buys.
  const bought = [...new Set(s.purchases.filter((p) => p.householdId === h.householdId).map((p) => p.productId))];
  const good = bought
    .flatMap((id) => { const product = productFor(id); return product ? offersFor(product) : []; })
    .map((o) => ({ o, insight: priceInsight(o) }))
    .filter((x) => x.insight.label === 1 || x.insight.label === 2)
    .sort((a, b) => (a.o.price / a.insight.average!) - (b.o.price / b.insight.average!))
    .slice(0, 2);
  for (const { o, insight } of good) {
    out.push({
      ...base(`op-good-${o.storeOfferId}`, false, addDays(t0, 3) + "T23:59:00Z", round2(insight.average! - o.price)),
      type: 2, title: tx({ pt: `${tx(o.product.name)} a bom preço no ${o.chain.name}`, en: `${tx(o.product.name)} at a good price at ${o.chain.name}` }),
      explanation: tx({ pt: `Está a ${o.price.toFixed(2).replace(".", ",")} €, abaixo da média de ${insight.average!.toFixed(2).replace(".", ",")} €.`, en: `It's €${o.price.toFixed(2)}, below the €${insight.average!.toFixed(2)} average.` }),
      payload: { productId: o.product.id, storeOfferId: o.storeOfferId, storeId: o.chain.storeId, current: o.price, average: insight.average, label: insight.label === 1 ? "HistoricLow" : "BelowAverage" },
    });
  }

  // Below what was paid last time.
  const lastPaid = new Map<string, DemoState["purchases"][number]>();
  for (const p of s.purchases.filter((x) => x.householdId === h.householdId && x.paid !== null).sort((a, b) => a.date.localeCompare(b.date))) lastPaid.set(p.productId, p);
  const below = [...lastPaid.values()]
    .map((p) => {
      const product = productFor(p.productId);
      const perPack = product ? p.paid! / Math.max(1, p.quantity.amount / product.qty) : 0;
      const cheapest = product ? offersFor(product).sort((a, b) => a.price - b.price)[0] : undefined;
      return { p, product, perPack, cheapest };
    })
    .filter((x) => x.cheapest && x.cheapest.price < x.perPack * 0.9)
    .sort((a, b) => (b.perPack - b.cheapest!.price) - (a.perPack - a.cheapest!.price))[0];
  if (below) {
    const o = below.cheapest!;
    out.push({
      ...base(`op-below-${o.storeOfferId}`, false, addDays(t0, 4) + "T23:59:00Z", round2(below.perPack - o.price)),
      type: 4, title: tx({ pt: `${tx(o.product.name)} mais barato do que da última vez`, en: `${tx(o.product.name)} cheaper than last time` }),
      explanation: tx({ pt: `No ${o.chain.name} está a ${o.price.toFixed(2).replace(".", ",")} €.`, en: `It's €${o.price.toFixed(2)} at ${o.chain.name}.` }),
      payload: { productId: o.product.id, storeOfferId: o.storeOfferId, storeId: o.chain.storeId, current: o.price, lastPaid: round2(below.perPack), lastPaidAt: below.p.date, lastPaidChainId: below.p.chainId, priceSource: below.p.source ?? "Offer" },
    });
  }

  // Splitting the weekly list.
  const openList = s.lists.find((l) => l.householdId === h.householdId && l.status === 0 && l.items.filter((i) => !i.isPurchased && (i.productId || i.ingredientId)).length >= 4);
  if (openList) {
    const totals = chains.map((ch) => ({ ch, total: openList.items.filter((i) => !i.isPurchased).map((i) => priceItemAt(i, ch.id)?.lineTotal ?? 0).reduce((a, b) => a + b, 0) }));
    const splitTotal = openList.items.filter((i) => !i.isPurchased).map((i) => Math.min(...chains.map((ch) => priceItemAt(i, ch.id)?.lineTotal ?? Infinity))).filter(Number.isFinite).reduce((a, b) => a + b, 0);
    const best = totals.sort((a, b) => a.total - b.total)[0];
    const saving = round2(best.total - splitTotal);
    if (saving > 0.5) {
      out.push({
        ...base(`op-split-${openList.shoppingListId}`, false, addDays(t0, 2) + "T23:59:00Z", saving),
        type: 3, title: tx({ pt: `Dividir "${txt(openList.name)}" por duas lojas poupa ${saving.toFixed(2).replace(".", ",")} €`, en: `Splitting "${txt(openList.name)}" across two shops saves €${saving.toFixed(2)}` }),
        explanation: tx({ pt: "Compara as lojas na lista para ver onde comprar cada coisa.", en: "Compare shops on the list to see where to buy each item." }),
        payload: { shoppingListId: openList.shoppingListId, storeCount: 2, bestStoreId: best.ch.storeId, savingVsBestStore: saving },
      });
    }
  }
  return out;
}

const MAX_SHOWN = 4;

route("GET", "/households/:h/opportunities", (c) => {
  const h = household(c.m[0]);
  const open = buildOpportunities(h).filter((o) => o.status === 0);
  return { generatedAt: nowIso(), items: open.slice(0, MAX_SHOWN), heldBackCount: Math.max(0, open.length - MAX_SHOWN), failedSignals: [] };
});

route("GET", "/households/:h/opportunities/summary", (c) => {
  const h = household(c.m[0]);
  const open = buildOpportunities(h).filter((o) => o.status === 0);
  const benefit = round2(open.reduce((a, o) => a + ((o.expectedBenefit as number | null) ?? 0), 0));
  const headline = open.length
    ? tx({ pt: `${open.length} ${open.length === 1 ? "ação pode" : "ações podem"} poupar cerca de ${Math.round(benefit)} €`, en: `${open.length} ${open.length === 1 ? "action" : "actions"} could save about €${Math.round(benefit)}` })
    : null;
  return { generatedAt: nowIso(), openCount: open.length, heldBackCount: Math.max(0, open.length - MAX_SHOWN), totalExpectedBenefit: benefit, headline, failedSignals: [] };
});

for (const [action, status, eventType] of [["dismiss", 2, "OpportunityDismissed"], ["act", 1, "OpportunityActed"]] as const) {
  route("POST", `/households/:h/opportunities/:o/${action}`, (c) => {
    const h = household(c.m[0]);
    st().opportunityStatus[c.m[1]] = status;
    log(h.householdId, eventType, "Opportunity", c.m[1]);
    const found = buildOpportunities(h).find((o) => o.opportunityId === c.m[1]);
    if (!found) throw notFound("opportunity-not-found");
    return found;
  });
}

// --------------------------------------------------------- saved recipes

route("GET", "/households/:h/saved-recipes", (c) => {
  household(c.m[0]);
  return st().saved.filter((s) => s.householdId === c.m[0]).sort((a, b) => b.savedAt.localeCompare(a.savedAt)).map((s) => {
    const r = recipeById.get(s.recipeId)!;
    return { recipeId: r.id, title: tx(r.title), imageUrl: r.imageUrl, servings: r.servings, origin: s.origin, savedByMemberId: "m-ana", savedAt: s.savedAt };
  });
});

route("PUT", "/households/:h/saved-recipes/:r", (c) => {
  household(c.m[0]);
  const r = recipeOrThrow(c.m[1]);
  let s = st().saved.find((x) => x.householdId === c.m[0] && x.recipeId === r.id);
  if (!s) { s = { householdId: c.m[0], recipeId: r.id, origin: 0, savedAt: nowIso() }; st().saved.push(s); }
  return { recipeId: r.id, title: tx(r.title), imageUrl: r.imageUrl, servings: r.servings, origin: s.origin, savedByMemberId: "m-ana", savedAt: s.savedAt };
});

route("DELETE", "/households/:h/saved-recipes/:r", (c) => {
  household(c.m[0]);
  st().saved = st().saved.filter((x) => !(x.householdId === c.m[0] && x.recipeId === c.m[1]));
});

route("GET", "/households/:h/recipes/cookable", (c) => {
  household(c.m[0]);
  const limit = num(c, "limit", 20);
  const stock = pantryStock(c.m[0]);
  const t0 = today();
  const soon = addDays(t0, 3);
  const savedIds = st().saved.filter((s) => s.householdId === c.m[0]);
  const plannedNear = st().planned.filter((p) => p.householdId === c.m[0] && p.recipeId && p.date >= addDays(t0, -7) && p.date <= addDays(t0, 7));
  const describe = (r: DemoRecipe) => {
    const checks = checkRecipe(c.m[0], r, r.servings, stock).filter((x) => !x.optional);
    const missing = checks.filter((x) => x.available < x.required - 1e-9);
    const saved = savedIds.find((s) => s.recipeId === r.id);
    return {
      recipeId: r.id, title: tx(r.title), imageUrl: r.imageUrl, servings: r.servings,
      verdict: missing.length === 0 ? 0 : missing.every((x) => x.available > 0) ? 1 : 2,
      requiredCount: checks.length, availableCount: checks.length - missing.length,
      missingIngredients: missing.map((x) => ingredientRef(x.ingredientId)),
      expiringIngredients: checks.filter((x) => x.available > 0 && x.expiresAt && x.expiresAt <= soon).map((x) => ({ ...ingredientRef(x.ingredientId), expiresAt: x.expiresAt! })),
      savedOrigin: saved?.origin ?? null, savedAt: saved?.savedAt ?? null,
      plannedOn: plannedNear.filter((p) => p.recipeId === r.id).map((p) => p.date),
    };
  };
  // "Yours": saved, plus what is planned for the next few days.
  const plannedSoon = plannedNear.filter((p) => p.date >= t0 && p.date <= soon);
  const mineIds = new Set([...savedIds.map((s) => s.recipeId), ...plannedSoon.map((p) => p.recipeId!)]);
  const saved = [...mineIds].map((id) => describe(recipeById.get(id)!)).sort((a, b) => a.verdict - b.verdict || b.availableCount / b.requiredCount - a.availableCount / a.requiredCount);
  const others = recipes.filter((r) => !mineIds.has(r.id)).map(describe).filter((x) => x.missingIngredients.length <= 1).sort((a, b) => a.verdict - b.verdict).slice(0, limit);
  return { saved, others };
});

route("GET", "/households/:h/recipes/cooked", (c) => {
  household(c.m[0]);
  const byRecipe = new Map<string, { count: number; last: string }>();
  for (const m of st().meals.filter((x) => x.householdId === c.m[0] && x.recipeId)) {
    const e = byRecipe.get(m.recipeId!) ?? { count: 0, last: "" };
    e.count += 1;
    if (m.date > e.last) e.last = m.date;
    byRecipe.set(m.recipeId!, e);
  }
  const list = [...byRecipe.entries()]
    .sort((a, b) => b[1].last.localeCompare(a[1].last))
    .map(([recipeId, e]) => {
      const r = recipeById.get(recipeId)!;
      return {
        recipeId, title: tx(r.title), imageUrl: r.imageUrl, timesCooked: e.count, lastCookedAt: `${e.last}T20:00:00Z`,
        isSaved: st().saved.some((s) => s.householdId === c.m[0] && s.recipeId === recipeId), isReadable: true,
      };
    });
  return paged(list, c);
});
