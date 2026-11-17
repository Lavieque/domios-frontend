// Demo calculations the real Api does on the server: shelf prices and price
// insight, unit conversions, pantry stock, recipe nutrition and availability.

import { addDays, today } from "../plan/dates";
import {
  U, chains, chainById, genericProductFor, ingredientById, l, productById, recipeById, storeName, tx,
  type DemoChain, type DemoProduct, type DemoRecipe, type L, type Nutrition,
} from "./catalog";
import { getState, type PantryItem, type Quantity, type Text } from "./state";

export function txt(value: Text): string {
  return typeof value === "string" ? value : tx(value);
}

export const round2 = (v: number) => Math.round(v * 100) / 100;

/** Stable pseudo-random number in [0, 1) from a string. */
export function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

function isoAt(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ------------------------------------------------------------- leftovers

/** Leftovers enter the pantry as a product of their own. */
export const LEFTOVER_PREFIX = "p-sobras-";

export function productFor(productId: string): DemoProduct | undefined {
  const found = productById.get(productId);
  if (found) return found;
  if (productId.startsWith(LEFTOVER_PREFIX)) {
    const recipe = recipeById.get(productId.slice(LEFTOVER_PREFIX.length));
    if (!recipe) return undefined;
    const perServing = recipeNutritionPerServing(recipe);
    const grams = 350;
    const per100 = Object.fromEntries(Object.entries(perServing).map(([k, v]) => [k, round2((v / grams) * 100)])) as unknown as Nutrition;
    return {
      id: productId, name: l(`Sobras: ${recipe.title.pt}`, `Leftovers: ${recipe.title.en}`), brand: null, categoryId: "c-mercearia",
      barcode: "", qty: 1, unit: U.un, ingredientId: null, price: 0, nutrition: per100, allergens: [], imageUrl: recipe.imageUrl,
    };
  }
  return undefined;
}

// ------------------------------------------------------------ conversions

const MASS = new Set<number>([U.g, U.kg]);
const VOLUME = new Set<number>([U.ml, U.l]);

/** Grams (or ml, taken as grams) of an amount of an ingredient. */
export function toGrams(ingredientId: string | null, q: Quantity): number {
  if (q.unit === U.g || q.unit === U.ml) return q.amount;
  if (q.unit === U.kg || q.unit === U.l) return q.amount * 1000;
  const ing = ingredientId ? ingredientById.get(ingredientId) : undefined;
  const custom = ingredientId ? getState().conversions[ingredientId]?.unitWeightGrams : undefined;
  return q.amount * (custom ?? ing?.unitWeight ?? 100);
}

/** The ingredient's base unit: units, grams or millilitres. */
export function baseUnit(ingredientId: string): number {
  const unit = ingredientById.get(ingredientId)?.defaultUnit ?? U.g;
  if (unit === U.un) return U.un;
  return VOLUME.has(unit) ? U.ml : U.g;
}

/** An amount in the ingredient's base unit. */
export function toBase(ingredientId: string, q: Quantity): number {
  const base = baseUnit(ingredientId);
  if (base === U.un) {
    if (q.unit === U.un) return q.amount;
    const grams = toGrams(null, q);
    const weight = getState().conversions[ingredientId]?.unitWeightGrams ?? ingredientById.get(ingredientId)?.unitWeight ?? 100;
    return grams / weight;
  }
  return toGrams(ingredientId, q);
}

export function sameDimension(a: number, b: number): boolean {
  return (MASS.has(a) && MASS.has(b)) || (VOLUME.has(a) && VOLUME.has(b)) || (a === U.un && b === U.un);
}

// ----------------------------------------------------------------- prices

export interface Offer {
  product: DemoProduct;
  chain: DemoChain;
  storeOfferId: string;
  /** What is paid today, without card. */
  price: number;
  regular: number;
  promo: null | { promotionId: string; discountPercent: number; requiresCard: boolean; inflated: boolean; startsAt: string; endsAt: string };
  history: number[];
}

export function offerFor(product: DemoProduct, chain: DemoChain): Offer | null {
  if (product.price <= 0) return null;
  const h = hash(product.id + chain.id);
  if (h < 0.05) return null; // not sold in this chain
  if (product.discontinued && chain.id !== "ch-continente") return null;
  const regular = round2(product.price * chain.factor * (0.96 + h * 0.08));
  const history: number[] = [];
  for (let d = 0; d < 30; d++) history.push(round2(regular * (0.95 + hash(product.id + chain.id + d) * 0.1)));
  let promo: Offer["promo"] = null;
  const ph = hash(chain.id + product.id + "promo");
  if (ph < 0.32 && !product.discontinued) {
    const discountPercent = [15, 20, 25, 30, 35, 50][Math.floor(hash(product.id + "pct" + chain.name) * 6)];
    promo = {
      promotionId: `promo-${product.id}-${chain.id}`, discountPercent, requiresCard: ph < 0.1, inflated: ph > 0.26,
      startsAt: isoAt(-2 - Math.floor(ph * 10), 0), endsAt: isoAt(3 + Math.floor(ph * 20), 23),
    };
  }
  const price = promo && !promo.requiresCard ? round2(regular * (1 - promo.discountPercent / 100) * (promo.inflated ? 1.2 : 1)) : regular;
  return { product, chain, storeOfferId: `so-${product.id}-${chain.id}`, price, regular, promo, history };
}

export function offersFor(product: DemoProduct): Offer[] {
  return chains.map((c) => offerFor(product, c)).filter((o): o is Offer => o !== null);
}

export function offerById(storeOfferId: string): Offer | null {
  const m = /^so-(.+)-(ch-[a-z]+)$/.exec(storeOfferId);
  if (!m) return null;
  const product = productById.get(m[1]);
  const chain = chainById.get(m[2]);
  return product && chain ? offerFor(product, chain) : null;
}

/** The price paid with card, when the promotion needs it. */
export function cardPrice(o: Offer): number | null {
  return o.promo?.requiresCard ? round2(o.regular * (1 - o.promo.discountPercent / 100)) : null;
}

export function unitPriceDto(product: DemoProduct, price: number) {
  let per: number = U.un;
  let amount = price / product.qty;
  if (product.unit === U.g) { per = U.kg; amount = price / (product.qty / 1000); }
  else if (product.unit === U.kg) { per = U.kg; }
  else if (product.unit === U.ml) { per = U.l; amount = price / (product.qty / 1000); }
  else if (product.unit === U.l) { per = U.l; }
  return { amount: round2(amount), currency: "EUR", per };
}

export function promotionDto(o: Offer) {
  const promo = o.promo!;
  return {
    promotionId: promo.promotionId,
    type: 0,
    description: tx(l(`${promo.discountPercent}% de desconto${promo.requiresCard ? " com cartão" : ""}`, `${promo.discountPercent}% off${promo.requiresCard ? " with loyalty card" : ""}`)),
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    minQuantity: null,
    maxQuantity: null,
    requiresCard: promo.requiresCard,
    status: 0,
    discountPercent: promo.discountPercent,
  };
}

export function priceInsight(o: Offer) {
  const all = [...o.history, o.price];
  const lowest = Math.min(...all);
  const highest = Math.max(...all);
  const average = round2(all.reduce((a, b) => a + b, 0) / all.length);
  const current = o.price;
  const label = current <= lowest + 0.001 ? 1 : current < average * 0.97 ? 2 : current > average * 1.03 ? 4 : 3;
  const ph = hash(o.product.id + o.chain.id + "freq");
  const pattern = [1, 2, 3, 4, 5][Math.floor(ph * 5)];
  const lowest30 = Math.min(...o.history);
  let promotionCheck = null;
  if (o.promo && !o.promo.requiresCard) {
    const priceBefore = o.promo.inflated ? round2(o.regular * 1.2) : o.regular;
    const real = round2(((lowest30 - current) / lowest30) * 100);
    promotionCheck = {
      promotionId: o.promo.promotionId,
      announcedDiscountPercent: o.promo.discountPercent,
      priceBefore,
      lowest30Days: lowest30,
      realDiscountPercent: Math.max(0, real),
      verdict: real <= 1 ? 1 : o.promo.inflated ? 2 : 3,
    };
  }
  return {
    label,
    current,
    lowest,
    highest,
    average,
    observationCount: all.length,
    since: isoAt(-90, 0),
    windowDays: 90,
    promotionCheck,
    promotionFrequency: {
      pattern,
      weeksObserved: 13,
      weeksOnPromotion: [0, 1, 3, 6, 11][pattern - 1],
      completePromotions: [0, 1, 2, 5, 9][pattern - 1],
      typicalIntervalDays: pattern >= 3 ? [0, 0, 0, 28, 14, 7][pattern] : null,
      since: isoAt(-90, 0),
      windowDays: 90,
    },
  };
}

export function storeOfferDto(o: Offer) {
  const card = cardPrice(o);
  return {
    storeOfferId: o.storeOfferId,
    storeId: o.chain.storeId,
    storeName: storeName(o.chain),
    chainId: o.chain.id,
    chainName: o.chain.name,
    availability: hash(o.storeOfferId + "stock") < 0.06 ? 2 : 1,
    latestPrice: {
      priceObservationId: `po-${o.storeOfferId}`,
      price: { amount: o.price, currency: "EUR" },
      observedAt: isoAt(0, 7),
      source: 1,
      confidence: 0.95,
      promotionId: o.promo && !o.promo.requiresCard ? o.promo.promotionId : null,
    },
    unitPrice: unitPriceDto(o.product, o.price),
    cardPrice: card === null ? null : {
      amount: card, currency: "EUR", discountPercent: o.promo!.discountPercent, promotionId: o.promo!.promotionId, endsAt: o.promo!.endsAt,
    },
    priceInsight: priceInsight(o),
  };
}

/**
 * The observations behind the verdict: the 30 history prices every 3 days over the last
 * 90 days, then today's (`observationCount` in the insight counts the same 31).
 */
export function priceHistoryDto(o: Offer) {
  const observation = (id: string, amount: number, observedAt: string, promotionId: string | null) => ({
    priceObservationId: id, price: { amount, currency: "EUR" }, observedAt, source: 1, confidence: 0.95, promotionId,
  });
  return [
    ...o.history.map((amount, d) => observation(`po-${o.storeOfferId}-${d}`, amount, isoAt(-90 + d * 3, 7), null)),
    observation(`po-${o.storeOfferId}`, o.price, isoAt(0, 7), o.promo && !o.promo.requiresCard ? o.promo.promotionId : null),
  ];
}

/** Cheapest offer (by price per package count needed) among products. */
export function cheapestOffer(productsToTry: DemoProduct[], chain: DemoChain): Offer | null {
  let best: Offer | null = null;
  for (const product of productsToTry) {
    const o = offerFor(product, chain);
    if (o && (!best || unitPriceDto(o.product, o.price).amount < unitPriceDto(best.product, best.price).amount)) best = o;
  }
  return best;
}

/** Shelf price of a package on a date, for purchases with no typed price. */
export function shelfPrice(productId: string, chainId: string | null): number | null {
  const product = productFor(productId);
  const chain = chainId ? chainById.get(chainId) : undefined;
  if (!product || !chain) return null;
  return offerFor(product, chain)?.price ?? null;
}

// ------------------------------------------------------------------ stock

export function inStock(item: PantryItem): boolean {
  return item.state <= 2 && item.quantity.amount > 0;
}

/** Pantry stock per ingredient, in its base unit, and the earliest expiry. */
export function pantryStock(householdId: string): Map<string, { amount: number; expiresAt: string | null }> {
  const stock = new Map<string, { amount: number; expiresAt: string | null }>();
  for (const item of getState().pantry) {
    if (item.householdId !== householdId || !inStock(item)) continue;
    const product = productFor(item.productId);
    const ingredientId = product?.ingredientId;
    if (!product || !ingredientId) continue;
    const amount = itemBaseAmount(item, product, ingredientId);
    const entry = stock.get(ingredientId) ?? { amount: 0, expiresAt: null };
    entry.amount += amount;
    if (item.expiresAt && (!entry.expiresAt || item.expiresAt < entry.expiresAt)) entry.expiresAt = item.expiresAt;
    stock.set(ingredientId, entry);
  }
  return stock;
}

/** Amount of a pantry item in its ingredient's base unit. */
export function itemBaseAmount(item: PantryItem, product: DemoProduct, ingredientId: string): number {
  // Packs counted in units of a mass product (e.g. 1 courgette) use the ingredient's weight.
  void product;
  return toBase(ingredientId, item.quantity);
}

/** Takes `needed` (ingredient base unit) out of the pantry, opened and soonest-expiring first. */
export function consumeIngredient(householdId: string, ingredientId: string, needed: number): void {
  const s = getState();
  const items = s.pantry
    .filter((i) => i.householdId === householdId && inStock(i) && productFor(i.productId)?.ingredientId === ingredientId)
    .sort((a, b) => (b.state === 1 ? 1 : 0) - (a.state === 1 ? 1 : 0) || (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"));
  let left = needed;
  for (const item of items) {
    if (left <= 0) break;
    const product = productFor(item.productId)!;
    const have = itemBaseAmount(item, product, ingredientId);
    if (have <= left + 1e-9) {
      left -= have;
      item.quantity = { ...item.quantity, amount: 0 };
      item.state = 3;
      item.endedAt = new Date().toISOString();
    } else {
      const ratio = (have - left) / have;
      const amount = item.quantity.amount * ratio;
      item.quantity = { ...item.quantity, amount: item.quantity.unit === U.g || item.quantity.unit === U.ml ? Math.round(amount) : round2(amount) };
      if (item.state === 0) { item.state = 1; item.openedAt = new Date().toISOString(); }
      left = 0;
    }
  }
}

// --------------------------------------------------------------- recipes

export function scaled(recipe: DemoRecipe, servings: number) {
  const factor = servings / recipe.servings;
  return recipe.ingredients.map((ing) => ({ ...ing, amount: ing.amount * factor }));
}

export interface IngredientCheck {
  ingredientId: string;
  required: number;
  available: number;
  optional: boolean;
  expiresAt: string | null;
}

export function checkRecipe(householdId: string, recipe: DemoRecipe, servings: number, stock = pantryStock(householdId)): IngredientCheck[] {
  return scaled(recipe, servings).map((ing) => {
    const required = toBase(ing.ingredientId, { amount: ing.amount, unit: ing.unit });
    const entry = stock.get(ing.ingredientId);
    return { ingredientId: ing.ingredientId, required, available: entry?.amount ?? 0, optional: !!ing.optional, expiresAt: entry?.expiresAt ?? null };
  });
}

export function ingredientRef(ingredientId: string) {
  return { ingredientId, name: tx(ingredientById.get(ingredientId)?.name ?? l(ingredientId, ingredientId)) };
}

export function recipeNutritionPerServing(recipe: DemoRecipe): Nutrition {
  const total: Nutrition = { energyKcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, saturates: 0, fiber: 0, salt: 0 };
  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;
    const product = genericProductFor(ing.ingredientId);
    if (!product) continue;
    const grams = toGrams(ing.ingredientId, { amount: ing.amount, unit: ing.unit });
    for (const key of Object.keys(total) as (keyof Nutrition)[]) total[key] += (product.nutrition[key] * grams) / 100;
  }
  for (const key of Object.keys(total) as (keyof Nutrition)[]) total[key] = round2(total[key] / recipe.servings);
  return total;
}

/** Allergens of a recipe's ingredients. */
export function ingredientAllergens(ingredientId: string): string[] {
  return ingredientById.get(ingredientId)?.allergens ?? [];
}

export function dateRange(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to && days.length < 400; d = addDays(d, 1)) days.push(d);
  return days;
}

export { today, addDays };
export type { L };
