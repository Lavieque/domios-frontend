import type { ReactNode } from "react";
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
 * Uma linha com preço (produto, oferta, promoção, loja): o nome à esquerda, a foto
 * à direita, o veredicto por baixo. Sem cartão; as linhas partem-se por filetes.
 * `index` fica por compatibilidade: já não há entrada escalonada.
 */
export function ShelfLabel({
  to,
  best = false,
  className = "",
  children,
  band,
  media,
}: {
  to?: string;
  index?: number;
  best?: boolean;
  className?: string;
  children: ReactNode;
  band?: ReactNode;
  /** À direita do texto: a foto da embalagem, quando existe. */
  media?: ReactNode;
}) {
  const classes = `price-row${best ? " is-best" : ""}${media ? " has-media" : ""}${className ? ` ${className}` : ""}`;
  const content = (
    <>
      <div className="price-row-body">
        {children}
        {band && <div className="price-row-verdict">{band}</div>}
      </div>
      {media && <div className="price-row-media">{media}</div>}
    </>
  );
  return to ? (
    <Link to={to} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

/** O preço na etiqueta amarela do almanaque: "0,89 €". `from` antepõe "desde". */
export function LabelPrice({ amount, from = false }: { amount: number | null | undefined; from?: boolean }) {
  if (amount === undefined) return <div className="label-price is-empty loading">A ler preços…</div>;
  if (amount === null) return <div className="label-price is-empty">Sem preço observado</div>;
  return (
    <div className="label-price" aria-label={`${from ? "desde " : ""}${money.format(amount)}`}>
      {from && <span className="label-price-from">desde</span>}
      <span className="price-tag">
        {priceDigits(amount)}
        <small> €</small>
      </span>
    </div>
  );
}

/** Ordem da escala, do mais barato ao mais caro: a casa cheia diz onde está o preço. */
const SCALE: PriceLabel[] = [
  PriceLabel.HistoricLow,
  PriceLabel.BelowAverage,
  PriceLabel.Usual,
  PriceLabel.AboveAverage,
];

/**
 * O veredicto do histórico: uma escala de quatro casas (mínimo, abaixo, habitual, acima)
 * com a do preço preenchida, e o rótulo da Api ao lado. Só tinta: o verde é "tens tudo"
 * e o vermelho é o que está a acabar. Com texto livre (`children`) fica só o texto.
 * `tone="urgent"` é uma promoção a acabar; `tone="1"` é o melhor da comparação.
 */
export function VerdictBand({
  insight,
  children,
  tone,
}: {
  insight?: PriceInsightDto | null;
  children?: ReactNode;
  tone?: string;
  /** Mantido por compatibilidade: o veredicto já não muda de forma fora da linha. */
  pill?: boolean;
}) {
  if (children !== undefined) {
    const kind = tone === "urgent" ? " is-urgent" : tone === "1" ? " is-strong" : tone === "none" ? " is-quiet" : "";
    return <span className={`price-verdict${kind}`}>{children}</span>;
  }
  if (!insight || insight.label === PriceLabel.InsufficientHistory) {
    return (
      <span className="price-verdict is-quiet">
        {insight ? priceLabelLabels[insight.label] : "Sem histórico de preços"}
      </span>
    );
  }
  const days = insight.windowDays;
  const text =
    insight.label === PriceLabel.HistoricLow ? `Mínimo dos últimos ${days} dias` : priceLabelLabels[insight.label];
  return (
    <span className={`price-verdict${insight.label === PriceLabel.HistoricLow ? " is-strong" : ""}`}>
      <span className="price-scale" aria-hidden="true">
        {SCALE.map((step) => (
          <span key={step} className={step === insight.label ? "is-on" : undefined} />
        ))}
      </span>
      {text}
    </span>
  );
}

/** Régua mínimo–máximo do período, com a média e o preço atual. */
export function PriceRange({ insight }: { insight: PriceInsightDto }) {
  const { lowest, highest, average, current } = insight;
  if (lowest === null || highest === null || highest <= lowest) return null;
  const at = (value: number) => `${Math.min(100, Math.max(0, ((value - lowest) / (highest - lowest)) * 100))}%`;
  return (
    <div
      className="price-range"
      aria-label={`Entre ${money.format(lowest)} e ${money.format(highest)} nos últimos ${insight.windowDays} dias`}
    >
      <div className="price-range-track">
        {average !== null && (
          <span className="price-range-avg" style={{ left: at(average) }} title={`Média ${money.format(average)}`} />
        )}
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

const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

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
              {check.announcedDiscountPercent !== null && (
                <>, anunciado {formatPercent(check.announcedDiscountPercent)}</>
              )}
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
