import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../api/client";
import {
  measurementUnitLabels,
  ProductStatus,
  StoreOfferAvailability,
  type ProductDto,
  type ProductStoreOfferDto,
} from "../api/types";
import { money, sortOffers, unitPriceLabel, useOffers } from "../catalog/offers";
import { EventTimeline } from "../components/EventTimeline";
import { PromotionBadge } from "../components/PromotionBadge";
import { InsightNotes, LabelPrice, PriceRange, ShelfLabel, VerdictBand } from "../components/ShelfLabel";

const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const offers = useOffers(id ?? "");

  useEffect(() => {
    if (!id) return;
    setProduct(null);
    getProduct(id).then(setProduct);
  }, [id]);

  if (!id) return null;
  if (!product) return <p className="muted loading">A carregar…</p>;

  const sorted = offers ? sortOffers(offers) : [];
  const lowest = sorted[0]?.latestPrice?.price.amount;

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        Voltar
      </button>

      <div className={product.imageUrl ? "product-hero" : undefined}>
        {product.imageUrl && <img className="product-image" src={product.imageUrl} alt={product.name} />}
        <div>
          <h1>{product.name}</h1>
          <ul className="spec-line">
            <li>
              <span>Marca</span>
              <strong>{product.brand ?? "Sem marca"}</strong>
            </li>
            <li>
              <span>Categoria</span>
              <strong>{product.category.name}</strong>
            </li>
            <li>
              <span>Embalagem</span>
              <strong>
                {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
              </strong>
            </li>
            <li>
              <span>EAN</span>
              <strong>{product.barcode ?? "—"}</strong>
            </li>
          </ul>
          {product.status === ProductStatus.Active ? (
            <Link to={`/despensa/adicionar?produto=${product.productId}`} className="button-primary">
              Adicionar à despensa
            </Link>
          ) : (
            <p className="notice">
              Descontinuado: já não se vende nas lojas acompanhadas.
              {product.substitutedByProductId && (
                <>
                  {" "}
                  <Link to={`/produtos/${product.substitutedByProductId}`}>Ver o produto que o substitui</Link>
                </>
              )}
            </p>
          )}
          {product.allergens.length > 0 && (
            <p className="muted" style={{ marginTop: "1rem" }}>
              Alergénios: {product.allergens.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="section-head">
        <h2>Preço por loja</h2>
        {sorted.length > 1 && lowest !== undefined && (
          <span className="muted">
            {sorted.filter((o) => o.latestPrice).length} lojas com preço
          </span>
        )}
      </div>
      {offers === undefined && <p className="muted loading">A ler preços…</p>}
      {offers === null && <p className="form-error">Não deu para ler os preços deste produto.</p>}
      {offers && offers.length === 0 && <p className="empty-state">Nenhuma loja acompanhada vende este produto.</p>}
      {offers && offers.length > 0 && (
        <div className="label-grid">
          {sorted.map((offer, index) => (
            <OfferLabel
              key={offer.storeOfferId}
              offer={offer}
              index={index}
              best={offer.latestPrice !== null && offer.latestPrice.price.amount === lowest && sorted.length > 1}
            />
          ))}
        </div>
      )}

      <h2>Histórico de eventos</h2>
      <EventTimeline aggregateType="Product" aggregateId={product.productId} />
    </div>
  );
}

const availabilityLabels: Record<StoreOfferAvailability, string | null> = {
  [StoreOfferAvailability.Unknown]: null,
  [StoreOfferAvailability.InStock]: "Disponível",
  [StoreOfferAvailability.OutOfStock]: "Esgotado",
};

function OfferLabel({ offer, index, best }: { offer: ProductStoreOfferDto; index: number; best: boolean }) {
  const unit = unitPriceLabel(offer);
  const availability = availabilityLabels[offer.availability];
  return (
    <ShelfLabel index={index} best={best} band={offer.latestPrice ? <VerdictBand insight={offer.priceInsight} /> : undefined}>
      <div className="label-head">
        <div>
          <div className="label-name">{offer.chainName}</div>
          <div className="label-meta">{offer.storeName}</div>
        </div>
        {best && <span className="pill pill-good">Mais barato</span>}
      </div>
      <LabelPrice amount={offer.latestPrice?.price.amount ?? null} />
      {unit && (
        <div className="label-unit">
          <strong>{unit}</strong>
        </div>
      )}
      {offer.cardPrice && (
        <div className="label-card">
          {money.format(offer.cardPrice.amount)} com cartão · até {dateFormat.format(new Date(offer.cardPrice.endsAt))}
        </div>
      )}
      <div className="label-foot">
        {offer.latestPrice && <span>Visto a {dateFormat.format(new Date(offer.latestPrice.observedAt))}</span>}
        {availability && (
          <span className={offer.availability === StoreOfferAvailability.OutOfStock ? "pill pill-danger" : undefined}>{availability}</span>
        )}
        {offer.latestPrice?.promotionId && <PromotionBadge promotionId={offer.latestPrice.promotionId} />}
      </div>
      {offer.priceInsight && (
        <>
          <PriceRange insight={offer.priceInsight} />
          <InsightNotes insight={offer.priceInsight} />
        </>
      )}
    </ShelfLabel>
  );
}
