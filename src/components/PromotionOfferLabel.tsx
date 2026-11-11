import { promotionTypeLabels, type CurrentPromotionDto } from "../api/types";
import { formatPackage } from "../catalog/package";
import { formatPercent, money, unitPriceLabel } from "../catalog/offers";
import { daysLeft, daysLeftLabel } from "../catalog/promotions";
import { ProductThumb } from "./ProductThumb";
import { LabelPrice, ShelfLabel, VerdictBand } from "./ShelfLabel";

/**
 * Uma oferta em promoção numa linha, como os produtos: o desconto ao lado do preço,
 * o prazo por baixo (em vermelho só quando está a acabar), a foto à direita.
 */
export function PromotionOfferLabel({ offer }: { offer: CurrentPromotionDto; index?: number }) {
  const { promotion } = offer;
  const urgent = daysLeft(promotion.endsAt) <= 2;
  const unit = unitPriceLabel(offer);
  // Com percentagem e sem cartão, "−15%" já diz tudo; a descrição só repete o desconto e as datas.
  const percentOnly = promotion.discountPercent !== null && !promotion.requiresCard;
  const discount =
    (promotion.discountPercent !== null
      ? `−${formatPercent(promotion.discountPercent)}`
      : promotion.description || promotionTypeLabels[promotion.type]) + (promotion.requiresCard ? " com cartão" : "");
  // Sem percentagem a descrição já é o desconto ("Leve 3, pague 2"); com cartão diz qual cartão.
  const descriptionInFoot = !percentOnly && promotion.discountPercent !== null;

  return (
    <ShelfLabel
      to={`/produtos/${offer.productId}`}
      className="product-row promotion-row"
      band={<VerdictBand tone={urgent ? "urgent" : "none"}>{daysLeftLabel(promotion.endsAt)}</VerdictBand>}
      media={offer.imageUrl ? <ProductThumb src={offer.imageUrl} /> : undefined}
    >
      <div className="label-name">{offer.productName}</div>
      <div className="label-meta">
        {offer.chainName} · {formatPackage(offer.packageQuantity, offer.packageUnit)}
      </div>
      <div className="label-price-line">
        <LabelPrice amount={offer.price.amount} />
        <span className="promotion-discount">{discount}</span>
        <span className="label-unit">
          {unit && <strong>{unit}</strong>}
          {unit && " · "}
          {offer.storeName}
          {offer.cardPrice && ` · ${money.format(offer.cardPrice.amount)} com cartão`}
        </span>
      </div>
      {(descriptionInFoot || (promotion.minQuantity !== null && promotion.minQuantity > 1)) && (
        <div className="label-foot">
          {descriptionInFoot && <span className="label-foot-line">{promotion.description}</span>}
          {promotion.minQuantity !== null && promotion.minQuantity > 1 && <span>Mín. {promotion.minQuantity} un</span>}
        </div>
      )}
    </ShelfLabel>
  );
}
