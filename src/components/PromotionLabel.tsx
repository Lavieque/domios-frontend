import { promotionTypeLabels, type PromotionDto } from "../api/types";
import { formatPercent } from "../catalog/offers";
import { daysBetween, today } from "../plan/dates";
import { ShelfLabel, VerdictBand } from "./ShelfLabel";

/** Dias de calendário até ao fim, no relógio da casa (Europe/Lisbon). */
function daysLeft(endsAt: string): number {
  return daysBetween(today(), today(new Date(endsAt)));
}

function daysLeftLabel(endsAt: string): string {
  const days = daysLeft(endsAt);
  if (days <= 0) return "Termina hoje";
  if (days === 1) return "Termina amanhã";
  return `Termina em ${days} dias`;
}

const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

/** Uma promoção como etiqueta: o desconto anunciado é o número, o prazo é a faixa. */
export function PromotionLabel({ promotion, index }: { promotion: PromotionDto; index: number }) {
  const urgent = daysLeft(promotion.endsAt) <= 2;
  return (
    <ShelfLabel
      index={index}
      band={<VerdictBand tone={urgent ? "urgent" : "none"}>{daysLeftLabel(promotion.endsAt)}</VerdictBand>}
    >
      <div className="label-name">{promotion.description}</div>
      {promotion.discountPercent !== null && (
        <div className="label-price" aria-label={`Menos ${formatPercent(promotion.discountPercent)}`}>
          −{formatPercent(promotion.discountPercent).replace("%", "")}
          <small>%</small>
        </div>
      )}
      <div className="label-foot">
        <span>{promotionTypeLabels[promotion.type]}</span>
        <span className="label-foot-line">
          {dateFormat.format(new Date(promotion.startsAt))} – {dateFormat.format(new Date(promotion.endsAt))}
        </span>
        {promotion.requiresCard && <span className="label-card">Com cartão</span>}
        {promotion.minQuantity !== null && promotion.minQuantity > 1 && <span>Mín. {promotion.minQuantity} un</span>}
      </div>
    </ShelfLabel>
  );
}
