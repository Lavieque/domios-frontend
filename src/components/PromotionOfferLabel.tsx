import { measurementUnitLabels, promotionTypeLabels, type CurrentPromotionDto } from "../api/types";
import { formatPercent, money, unitPriceLabel } from "../catalog/offers";
import { daysLeft, daysLeftLabel } from "../catalog/promotions";
import { AisleSign } from "./AisleSign";
import { LabelPrice, ShelfLabel, VerdictBand } from "./ShelfLabel";

/**
 * Uma oferta em promoção com o mesmo cartão dos produtos: foto por cima, o
 * desconto na etiqueta da foto, o preço de hoje na loja, o prazo na faixa.
 * A oferta não traz categoria, por isso a foto fica no campo neutro.
 */
export function PromotionOfferLabel({ offer, index }: { offer: CurrentPromotionDto; index: number }) {
  const { promotion } = offer;
  const urgent = daysLeft(promotion.endsAt) <= 2;
  const unit = unitPriceLabel(offer);
  // Com percentagem e sem cartão, "−15%" já diz tudo; a descrição só repete o desconto e as datas.
  const percentOnly = promotion.discountPercent !== null && !promotion.requiresCard;

  return (
    <ShelfLabel
      to={`/produtos/${offer.productId}`}
      index={index}
      className="product-card promotion-card"
      band={<VerdictBand tone={urgent ? "urgent" : "none"}>{daysLeftLabel(promotion.endsAt)}</VerdictBand>}
      media={
        <div className={`product-photo${offer.imageUrl ? "" : " is-empty"}`}>
          <span className="product-photo-tag promotion-tag">
            {promotion.discountPercent !== null ? `−${formatPercent(promotion.discountPercent)}` : promotionTypeLabels[promotion.type]}
            {promotion.requiresCard && " com cartão"}
          </span>
          {offer.imageUrl ? <img src={offer.imageUrl} alt="" loading="lazy" /> : <AisleSign aisle={null} />}
        </div>
      }
    >
      <div className="label-name">{offer.productName}</div>
      <div className="label-meta">
        {offer.chainName} · {offer.packageQuantity} {measurementUnitLabels[offer.packageUnit]}
      </div>
      <LabelPrice amount={offer.price.amount} />
      <div className="label-unit">
        {unit && <strong>{unit}</strong>}
        {unit && " · "}
        {offer.storeName}
      </div>
      {offer.cardPrice && <div className="label-card">{money.format(offer.cardPrice.amount)} com cartão</div>}
      {(!percentOnly || (promotion.minQuantity !== null && promotion.minQuantity > 1)) && (
        <div className="label-foot">
          {!percentOnly && <span className="label-foot-line">{promotion.description}</span>}
          {promotion.minQuantity !== null && promotion.minQuantity > 1 && <span>Mín. {promotion.minQuantity} un</span>}
        </div>
      )}
    </ShelfLabel>
  );
}
