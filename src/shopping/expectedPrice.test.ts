import { describe, expect, it } from "vitest";
import type { ShoppingItemPackagingDto } from "../api/shopping";
import { MeasurementUnit, StoreOfferAvailability, type ProductStoreOfferDto } from "../api/types";
import { averageShelfPrice, packagesFor } from "./expectedPrice";

const offer = (amount: number | null, availability: StoreOfferAvailability = StoreOfferAvailability.InStock) =>
  ({ latestPrice: amount === null ? null : { price: { amount, currency: "EUR" } }, availability }) as ProductStoreOfferDto;

describe("averageShelfPrice", () => {
  it("averages the offers on sale", () => {
    expect(averageShelfPrice([offer(1), offer(2), offer(3)])).toBe(2);
  });

  it("ignores offers without a price and the ones out of stock", () => {
    expect(averageShelfPrice([offer(1), offer(null), offer(9, StoreOfferAvailability.OutOfStock)])).toBe(1);
  });

  it("gives null when nothing is on sale", () => {
    expect(averageShelfPrice([offer(null)])).toBeNull();
    expect(averageShelfPrice([])).toBeNull();
    expect(averageShelfPrice(null)).toBeNull();
  });
});

describe("packagesFor", () => {
  const item = { shoppingListItemId: "i", quantity: { amount: 700, unit: MeasurementUnit.Gram } };
  const product = { packageQuantity: 250, packageUnit: MeasurementUnit.Gram };

  it("uses the Api's packaging first", () => {
    const packaging = { packageCount: 4 } as ShoppingItemPackagingDto;
    expect(packagesFor(item, product, packaging)).toBe(4);
  });

  it("rounds up when the units match", () => {
    expect(packagesFor(item, product, undefined)).toBe(3);
  });

  it("is one when the units differ or the product is unknown", () => {
    expect(packagesFor(item, { packageQuantity: 1, packageUnit: MeasurementUnit.Kilogram }, undefined)).toBe(1);
    expect(packagesFor(item, undefined, undefined)).toBe(1);
  });
});
