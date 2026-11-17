import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { getPriceHistory } from "../api/client";
import { chartGeometry, nearestPoint, toPoints, type Point } from "../catalog/priceHistory";
import { money } from "../catalog/offers";
import { dateTimeFormat } from "../i18n/format";
import { tr } from "../i18n";

/** O mesmo período da régua e do veredicto da Api. */
const WINDOW_DAYS = 90;
const DAY = 86_400_000;

const shortDate = dateTimeFormat({ day: "numeric", month: "short" });
const longDate = dateTimeFormat({ day: "numeric", month: "short", year: "numeric" });

/**
 * As observações dos últimos 90 dias de uma oferta numa loja. Só pede quando se monta: o
 * detalhe da loja monta-o ao abrir. Sem observações suficientes, ou com erro, fica em texto.
 */
export function PriceHistory({ storeId, storeOfferId }: { storeId: string; storeOfferId: string }) {
  // `now` fica com o momento do pedido: a linha vai até aí, sem ler o relógio a cada render.
  const [data, setData] = useState<{ points: Point[]; observed: number; now: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const from = new Date(Date.now() - WINDOW_DAYS * DAY).toISOString();
    getPriceHistory(storeId, storeOfferId, from)
      .then((observations) => active && setData({ points: toPoints(observations), observed: observations.length, now: Date.now() }))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [storeId, storeOfferId]);

  if (failed) return null;
  if (data === null) return <p className="muted price-history-note">{tr().ui.price.historyLoading}</p>;
  // Só em euros: um histórico noutra moeda não se mostra (nem se diz que há poucas observações).
  if (data.points.length < 2) {
    return data.observed - data.points.length > 0 ? null : <p className="muted price-history-note">{tr().ui.price.historyTooFew}</p>;
  }
  return <Chart points={data.points} now={data.now} />;
}

function Chart({ points, now }: { points: Point[]; now: number }) {
  const plot = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => chartGeometry(points, now), [points, now]);

  const { low, high, x, y, path, start, end } = geometry;
  const anyPromotion = points.some((p) => p.promotion);
  const summary = tr().ui.price.historySummary(points.length, money.format(low), money.format(high));
  const active = hover === null ? null : points[hover];

  function nearest(event: PointerEvent<HTMLDivElement>) {
    const box = plot.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) * 100;
    const best = nearestPoint(points, x, ratio);
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
