// O gráfico do histórico de preços de uma loja (components/PriceHistory.tsx), sem React:
// que observações entram, a escala e o desenho em escada, num referencial de 0 a 100.

import type { PriceObservationDto } from "../api/types";

export interface Point {
  at: number;
  price: number;
  promotion: boolean;
}

/** Só euros e datas válidas, da mais antiga à mais recente. */
export function toPoints(observations: PriceObservationDto[]): Point[] {
  return observations
    .filter((o) => o.price.currency === "EUR")
    .map((o) => ({ at: Date.parse(o.observedAt), price: o.price.amount, promotion: o.promotionId !== null }))
    .filter((p) => Number.isFinite(p.at))
    .sort((a, b) => a.at - b.at);
}

export interface ChartGeometry {
  start: number;
  end: number;
  low: number;
  high: number;
  /** Instante para 0..100 (esquerda para direita). */
  x: (at: number) => number;
  /** Preço para 0..100 (de cima para baixo: o mais caro em cima). */
  y: (price: number) => number;
  /** Caminho SVG em escada no viewBox 0 0 100 100. */
  path: string;
}

/** Precisa de pelo menos um ponto. `now` é até onde vai a linha (o último preço vale até hoje). */
export function chartGeometry(points: Point[], now: number): ChartGeometry {
  const start = points[0].at;
  const end = Math.max(now, points[points.length - 1].at);
  const prices = points.map((p) => p.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  // Folga em cima e em baixo; com o preço sempre igual, uma folga fixa para a linha não colar à borda.
  const pad = high > low ? (high - low) * 0.15 : Math.max(0.05, low * 0.05);
  const bottom = low - pad;
  const top = high + pad;
  const x = (at: number) => (end > start ? ((at - start) / (end - start)) * 100 : 0);
  const y = (price: number) => 100 - ((price - bottom) / (top - bottom)) * 100;
  // Escada: cada preço mantém-se até à observação seguinte.
  let path = `M ${x(points[0].at)} ${y(points[0].price)}`;
  for (let i = 1; i < points.length; i++) path += ` H ${x(points[i].at)} V ${y(points[i].price)}`;
  path += " H 100";
  return { start, end, low, high, x, y, path };
}

/** O ponto mais perto, na horizontal, de `ratio` (0..100). */
export function nearestPoint(points: Point[], x: (at: number) => number, ratio: number): number {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(x(points[i].at) - ratio) < Math.abs(x(points[best].at) - ratio)) best = i;
  }
  return best;
}
