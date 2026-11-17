import { describe, expect, it } from "vitest";
import type { PriceObservationDto } from "../api/types";
import { chartGeometry, nearestPoint, toPoints, type Point } from "./priceHistory";

const obs = (observedAt: string, amount: number, extra: Partial<PriceObservationDto> = {}): PriceObservationDto => ({
  priceObservationId: observedAt,
  price: { amount, currency: "EUR" },
  observedAt,
  source: 1,
  confidence: 1,
  promotionId: null,
  ...extra,
});

const DAY = 86_400_000;
const T0 = Date.parse("2026-11-01T00:00:00Z");

describe("toPoints", () => {
  it("ordena por data, marca promoções e deixa de fora outras moedas e datas inválidas", () => {
    const points = toPoints([
      obs("2026-11-03T00:00:00Z", 2, { promotionId: "promo-1" }),
      obs("2026-11-01T00:00:00Z", 3),
      obs("2026-11-02T00:00:00Z", 9, { price: { amount: 9, currency: "USD" } }),
      obs("nope", 4),
    ]);
    expect(points).toEqual([
      { at: Date.parse("2026-11-01T00:00:00Z"), price: 3, promotion: false },
      { at: Date.parse("2026-11-03T00:00:00Z"), price: 2, promotion: true },
    ]);
  });
});

describe("chartGeometry", () => {
  const points: Point[] = [
    { at: T0, price: 2, promotion: false },
    { at: T0 + 5 * DAY, price: 4, promotion: false },
  ];

  it("vai do primeiro ponto até agora, com o mais caro em cima", () => {
    const g = chartGeometry(points, T0 + 10 * DAY);
    expect(g.x(T0)).toBe(0);
    expect(g.x(T0 + 5 * DAY)).toBe(50);
    expect(g.x(T0 + 10 * DAY)).toBe(100);
    expect(g.y(4)).toBeLessThan(g.y(2));
    // Folga de 15%: nem o mínimo nem o máximo colam à borda.
    expect(g.y(4)).toBeGreaterThan(0);
    expect(g.y(2)).toBeLessThan(100);
  });

  it("desenha em escada: horizontal até à observação seguinte, depois vertical", () => {
    const g = chartGeometry(points, T0 + 10 * DAY);
    expect(g.path).toBe(`M 0 ${g.y(2)} H 50 V ${g.y(4)} H 100`);
  });

  it("com o preço sempre igual, a linha fica a meio e não divide por zero", () => {
    const flat = chartGeometry([points[0], { ...points[1], price: 2 }], T0 + 10 * DAY);
    expect(flat.y(2)).toBeCloseTo(50);
    expect(Number.isFinite(flat.y(2))).toBe(true);
  });

  it("uma observação depois de 'agora' (relógio adiantado) não sai do gráfico", () => {
    const g = chartGeometry(points, T0);
    expect(g.end).toBe(T0 + 5 * DAY);
    expect(g.x(T0 + 5 * DAY)).toBe(100);
  });
});

describe("nearestPoint", () => {
  it("escolhe o ponto mais perto na horizontal", () => {
    const points: Point[] = [0, 4, 10].map((d) => ({ at: T0 + d * DAY, price: 1, promotion: false }));
    const g = chartGeometry(points, T0 + 10 * DAY);
    expect(nearestPoint(points, g.x, 0)).toBe(0);
    expect(nearestPoint(points, g.x, 35)).toBe(1);
    expect(nearestPoint(points, g.x, 80)).toBe(2);
  });
});
