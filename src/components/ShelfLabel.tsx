import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  PriceLabel,
  priceLabelLabels,
  PromotionPattern,
  promotionPatternLabels,
  PromotionVerdict,
  promotionVerdictLabels,
  type PriceInsightDto,
} from "../api/types";
import { formatPercent, money, priceDigits } from "../catalog/offers";

/**
 * A etiqueta de prateleira: o contentor de tudo o que tem preço (produto,
 * oferta, promoção, loja). `index` escalona a entrada na grelha.
 */
export function ShelfLabel({
  to,
  index = 0,
  best = false,
  className = "",
  children,
  band,
}: {
  to?: string;
  index?: number;
  best?: boolean;
  className?: string;
  children: ReactNode;
  band?: ReactNode;
}) {
  const style = { "--i": Math.min(index, 12) } as CSSProperties;
  const classes = `shelf-label${best ? " is-best" : ""}${className ? ` ${className}` : ""}`;
  const content = (
    <>
      <div className="label-body">{children}</div>
      {band}
    </>
  );
  return to ? (
    <Link to={to} className={classes} style={style}>
      {content}
    </Link>
  ) : (
    <div className={classes} style={style}>
      {content}
    </div>
  );
}

/** O número da etiqueta: "0,89 €". `from` antepõe "desde". */
export function LabelPrice({ amount, from = false }: { amount: number | null | undefined; from?: boolean }) {
  if (amount === undefined) return <div className="label-price is-empty loading">A ler preços…</div>;
  if (amount === null) return <div className="label-price is-empty">Sem preço observado</div>;
  return (
    <div className="label-price" aria-label={money.format(amount)}>
      {from && <span className="label-price-from">desde</span>}
      {priceDigits(amount)}
      <small>€</small>
    </div>
  );
}

/** A faixa do veredicto, com o rótulo da Api (PriceLabel) ou um texto livre. */
export function VerdictBand({ insight, children, tone }: { insight?: PriceInsightDto | null; children?: ReactNode; tone?: string }) {
  if (children !== undefined) {
    return <div className={`verdict verdict-${tone ?? "none"}`}>{children}</div>;
  }
  if (!insight) return <div className="verdict verdict-none">Sem histórico de preços</div>;
  const days = insight.windowDays;
  const text =
    insight.label === PriceLabel.HistoricLow ? `Mínimo dos últimos ${days} dias` : priceLabelLabels[insight.label];
  return <div className={`verdict verdict-${insight.label}`}>{text}</div>;
}

/** Régua mínimo–máximo do período, com a média e o preço atual. */
export function PriceRange({ insight }: { insight: PriceInsightDto }) {
  const { lowest, highest, average, current } = insight;
  if (lowest === null || highest === null || highest <= lowest) return null;
  const at = (value: number) => `${Math.min(100, Math.max(0, ((value - lowest) / (highest - lowest)) * 100))}%`;
  return (
    <div className="price-range" aria-label={`Entre ${money.format(lowest)} e ${money.format(highest)} nos últimos ${insight.windowDays} dias`}>
      <div className="price-range-track">
        {average !== null && <span className="price-range-avg" style={{ left: at(average) }} title={`Média ${money.format(average)}`} />}
        <span className="price-range-now" style={{ left: at(current) }} title={`Agora ${money.format(current)}`} />
      </div>
      <div className="price-range-legend">
        <span>mín {money.format(lowest)}</span>
        {average !== null && <span>média {money.format(average)}</span>}
        <span>máx {money.format(highest)}</span>
      </div>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" });

/** O que o histórico diz: observações, verificação Omnibus, frequência de promoção. */
export function InsightNotes({ insight }: { insight: PriceInsightDto }) {
  const check = insight.promotionCheck;
  const frequency = insight.promotionFrequency;
  return (
    <ul className="insight-notes">
      <li>
        {insight.observationCount} {insight.observationCount === 1 ? "observação" : "observações"}
        {insight.since && <> desde {dateFormat.format(new Date(insight.since))}</>}
      </li>
      {check && (
        <li>
          <strong>{promotionVerdictLabels[check.verdict]}</strong>
          {check.verdict !== PromotionVerdict.InsufficientHistory && check.realDiscountPercent !== null && (
            <>
              {": "}
              {formatPercent(check.realDiscountPercent)} contra o mínimo de 30 dias
              {check.lowest30Days !== null && <> ({money.format(check.lowest30Days)})</>}
              {check.announcedDiscountPercent !== null && <>, anunciado {formatPercent(check.announcedDiscountPercent)}</>}
            </>
          )}
        </li>
      )}
      {frequency.pattern !== PromotionPattern.InsufficientHistory && (
        <li>
          {promotionPatternLabels[frequency.pattern]}: {frequency.weeksOnPromotion} de {frequency.weeksObserved} semanas
          {frequency.typicalIntervalDays !== null && <>, em regra a cada {frequency.typicalIntervalDays} dias</>}
        </li>
      )}
    </ul>
  );
}
