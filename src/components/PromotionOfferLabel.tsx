import { measurementUnitLabels, promotionTypeLabels, type CurrentPromotionDto } from "../api/types";
import { formatPercent, money, unitPriceLabel } from "../catalog/offers";
import { daysLeft, daysLeftLabel } from "../catalog/promotions";
import { LabelPrice, ShelfLabel, VerdictBand } from "./ShelfLabel";

/**
 * Uma oferta em promoção como etiqueta: o preço de hoje na loja é o número,
 * o desconto e o tipo vão no rodapé, o prazo é a faixa.
 */
export function PromotionOfferLabel({ offer, index }: { offer: CurrentPromotionDto; index: number }) {
  const { promotion } = offer;
  const urgent = daysLeft(promotion.endsAt) <= 2;
  const unit = unitPriceLabel(offer);

  return (
    <ShelfLabel
      to={`/produtos/${offer.productId}`}
      index={index}
      band={<VerdictBand tone={urgent ? "urgent" : "none"}>{daysLeftLabel(promotion.endsAt)}</VerdictBand>}
    >
      <div className="label-head">
        <div>
          <div className="label-name">{offer.productName}</div>
          <div className="label-meta">
            {offer.chainName} · {offer.packageQuantity} {measurementUnitLabels[offer.packageUnit]}
          </div>
        </div>
        {offer.imageUrl && <img className="label-thumb" src={offer.imageUrl} alt="" loading="lazy" />}
      </div>
      <LabelPrice amount={offer.price.amount} />
      <div className="label-unit">
        {unit && <strong>{unit}</strong>}
        {unit && " · "}
        {offer.storeName}
      </div>
      {offer.cardPrice && <div className="label-card">{money.format(offer.cardPrice.amount)} com cartão</div>}
      <div className="label-foot">
        {promotion.discountPercent !== null && !promotion.requiresCard && (
          <span className="pill pill-accent2">−{formatPercent(promotion.discountPercent)}</span>
        )}
        <span>{promotionTypeLabels[promotion.type]}</span>
        <span className="label-foot-line">{promotion.description}</span>
        {promotion.minQuantity !== null && promotion.minQuantity > 1 && <span>Mín. {promotion.minQuantity} un</span>}
      </div>
    </ShelfLabel>
  );
}
