import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { getPriceHistory } from "../api/client";
import type { PriceObservationDto } from "../api/types";
import { money } from "../catalog/offers";
import { dateTimeFormat } from "../i18n/format";
import { tr } from "../i18n";

/** O mesmo período da régua e do veredicto da Api. */
const WINDOW_DAYS = 90;
const DAY = 86_400_000;

const shortDate = dateTimeFormat({ day: "numeric", month: "short" });
const longDate = dateTimeFormat({ day: "numeric", month: "short", year: "numeric" });

interface Point {
  at: number;
  price: number;
  promotion: boolean;
}

/**
 * As observações dos últimos 90 dias de uma oferta numa loja. Só pede quando se monta: o
 * detalhe da loja monta-o ao abrir. Sem observações suficientes, ou com erro, fica em texto.
 */
export function PriceHistory({ storeId, storeOfferId }: { storeId: string; storeOfferId: string }) {
  // `now` fica com o momento do pedido: a linha vai até aí, sem ler o relógio a cada render.
  const [data, setData] = useState<{ points: Point[]; now: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const from = new Date(Date.now() - WINDOW_DAYS * DAY).toISOString();
    getPriceHistory(storeId, storeOfferId, from)
      .then((observations) => active && setData({ points: toPoints(observations), now: Date.now() }))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [storeId, storeOfferId]);

  if (failed) return null;
  if (data === null) return <p className="muted price-history-note">{tr().ui.price.historyLoading}</p>;
  if (data.points.length < 2) return <p className="muted price-history-note">{tr().ui.price.historyTooFew}</p>;
  return <Chart points={data.points} now={data.now} />;
}

function toPoints(observations: PriceObservationDto[]): Point[] {
  return observations
    .filter((o) => o.price.currency === "EUR")
    .map((o) => ({ at: Date.parse(o.observedAt), price: o.price.amount, promotion: o.promotionId !== null }))
    .filter((p) => Number.isFinite(p.at))
    .sort((a, b) => a.at - b.at);
}

function Chart({ points, now }: { points: Point[]; now: number }) {
  const plot = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const start = points[0].at;
    // O último preço vale até hoje: a linha estende-se até ao fim do período.
    const end = Math.max(now, points[points.length - 1].at);
    const prices = points.map((p) => p.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const pad = high > low ? (high - low) * 0.15 : Math.max(0.05, low * 0.05);
    const bottom = low - pad;
    const top = high + pad;
    const x = (at: number) => (end > start ? ((at - start) / (end - start)) * 100 : 0);
    const y = (price: number) => 100 - ((price - bottom) / (top - bottom)) * 100;
    // Escada: cada preço mantém-se até à observação seguinte.
    let path = `M ${x(points[0].at)} ${y(points[0].price)}`;
    for (let i = 1; i < points.length; i++) path += ` H ${x(points[i].at)} V ${y(points[i].price)}`;
    path += ` H 100`;
    return { start, end, low, high, x, y, path };
  }, [points, now]);

  const { low, high, x, y, path, start, end } = geometry;
  const anyPromotion = points.some((p) => p.promotion);
  const summary = tr().ui.price.historySummary(points.length, money.format(low), money.format(high));
  const active = hover === null ? null : points[hover];

  function nearest(event: PointerEvent<HTMLDivElement>) {
    const box = plot.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) * 100;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(x(points[i].at) - ratio) < Math.abs(x(points[best].at) - ratio)) best = i;
    }
    setHover(best);
  }

  return (
    <figure className="price-history">
      <figcaption className="price-history-title">{tr().ui.price.history(WINDOW_DAYS)}</figcaption>
      <div className="price-history-frame">
        <div className="price-history-scale" aria-hidden="true">
          <span>{money.format(high)}</span>
          <span>{money.format(low)}</span>
        </div>
        <div
          ref={plot}
          className="price-history-plot"
          role="img"
          aria-label={summary}
          onPointerMove={nearest}
          onPointerDown={nearest}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line className="price-history-grid" x1="0" x2="100" y1={y(high)} y2={y(high)} vectorEffect="non-scaling-stroke" />
            <line className="price-history-grid" x1="0" x2="100" y1={y(low)} y2={y(low)} vectorEffect="non-scaling-stroke" />
            <path className="price-history-line" d={path} vectorEffect="non-scaling-stroke" />
          </svg>
          {points.map((p, i) => (
            <span
              key={`${p.at}-${i}`}
              className={`price-history-dot${p.promotion ? " is-promotion" : ""}${hover === i ? " is-active" : ""}`}
              style={{ left: `${x(p.at)}%`, top: `${y(p.price)}%` }}
              aria-hidden="true"
            />
          ))}
          {active && (
            <>
              <span className="price-history-crosshair" style={{ left: `${x(active.at)}%` }} aria-hidden="true" />
              <span
                className="price-history-tip"
                data-side={x(active.at) > 60 ? "left" : "right"}
                style={{ left: `${x(active.at)}%`, top: `${y(active.price)}%` }}
                aria-hidden="true"
              >
                <strong>{money.format(active.price)}</strong>
                <span>{longDate.format(active.at)}</span>
                {active.promotion && <span>{tr().ui.price.historyOnPromotion}</span>}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="price-history-axis" aria-hidden="true">
        <span>{shortDate.format(start)}</span>
        <span>{shortDate.format(end)}</span>
      </div>
      {anyPromotion && (
        <p className="price-history-legend" aria-hidden="true">
          <span className="price-history-dot is-promotion is-key" /> {tr().ui.price.historyOnPromotion}
        </p>
      )}
      {/* A vista em tabela, para leitores de ecrã. */}
      <table className="visually-hidden">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">{tr().ui.price.historyDate}</th>
            <th scope="col">{tr().ui.price.historyPrice}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={`${p.at}-${i}`}>
              <td>{longDate.format(p.at)}</td>
              <td>
                {money.format(p.price)}
                {p.promotion && ` (${tr().ui.price.historyOnPromotion})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
