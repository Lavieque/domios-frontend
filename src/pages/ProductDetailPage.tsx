import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../api/client";
import {
  measurementUnitLabels,
  ProductStatus,
  StoreOfferAvailability,
  type ProductDto,
  type ProductStoreOfferDto,
} from "../api/types";
import { aisleClass, aisleOf, topCategory } from "../catalog/aisles";
import { isOnSale, money, priceDigits, sortOffers, unitPriceLabel, useOffers } from "../catalog/offers";
import { useCategories } from "../catalog/useCategories";
import { AisleSign } from "../components/AisleSign";
import { EventTimeline } from "../components/EventTimeline";
import { PromotionBadge } from "../components/PromotionBadge";
import { InsightNotes, LabelPrice, PriceRange, VerdictBand } from "../components/ShelfLabel";

const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const offers = useOffers(id ?? "");
  const categories = useCategories();

  useEffect(() => {
    if (!id) return;
    setProduct(null);
    getProduct(id).then(setProduct);
  }, [id]);

  if (!id) return null;
  if (!product) return <p className="muted loading">A carregar…</p>;

  const sorted = offers ? sortOffers(offers) : [];
  const onSale = sorted.filter(isOnSale);
  const cheapest = onSale[0];
  const lowest = cheapest?.latestPrice?.price.amount;
  const highest = onSale[onSale.length - 1]?.latestPrice?.price.amount;
  const top = topCategory(product.category, categories) ?? product.category;
  const aisle = aisleOf(top.name);
  const unit = cheapest ? unitPriceLabel(cheapest) : null;
  const pack = `${product.packageQuantity} ${measurementUnitLabels[product.packageUnit]}`;

  return (
    <div className="page">
      <nav className="crumb" aria-label="Caminho">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          Voltar
        </button>
        <span aria-hidden="true">·</span>
        <Link to={`/produtos?categoryId=${top.categoryId}`}>{top.name}</Link>
        {top.categoryId !== product.category.categoryId && (
          <>
            <span aria-hidden="true">/</span>
            <span>{product.category.name}</span>
          </>
        )}
      </nav>

      <section className={`article-hero ${aisleClass(aisle)}`}>
        <div className={`article-photo${product.imageUrl ? "" : " is-empty"}`}>
          <span className="product-photo-tag">
            <span className="aisle-dot" />
            {top.name}
          </span>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <AisleSign aisle={aisle} />
          )}
        </div>

        <div className="article-info">
          <h1>{product.name}</h1>
          <p className="article-brand">
            {product.brand ?? "Sem marca"} · {pack}
          </p>

          <div className="article-price">
            {offers === undefined ? (
              <LabelPrice amount={undefined} />
            ) : (
              <LabelPrice amount={lowest ?? null} from={onSale.length > 1 && highest !== lowest} />
            )}
            {cheapest && (
              <div className="article-price-facts">
                <VerdictBand insight={cheapest.priceInsight} pill />
                <span className="article-unit">
                  {unit && <strong>{unit}</strong>}
                  {unit && " · "}
                  {cheapest.chainName}
                  {cheapest.cardPrice && <> · com cartão {money.format(cheapest.cardPrice.amount)}</>}
                </span>
              </div>
            )}
          </div>

          {cheapest?.priceInsight && (
            <div className="article-insight">
              <PriceRange insight={cheapest.priceInsight} />
              <InsightNotes insight={cheapest.priceInsight} />
            </div>
          )}

          {product.status === ProductStatus.Active ? (
            <div className="article-actions">
              <Link to={`/despensa/adicionar?produto=${product.productId}`} className="button-primary">
                Adicionar à despensa
              </Link>
            </div>
          ) : (
            <p className="notice" style={{ marginTop: "1.5rem" }}>
              Descontinuado: já não se vende nas lojas acompanhadas.
              {product.substitutedByProductId && (
                <>
                  {" "}
                  <Link to={`/produtos/${product.substitutedByProductId}`}>Ver o produto que o substitui</Link>
                </>
              )}
            </p>
          )}

          <ul className="article-specs">
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
              <strong>{pack}</strong>
            </li>
            <li>
              <span>EAN</span>
              <strong>{product.barcode ?? "—"}</strong>
            </li>
            {product.allergens.length > 0 && (
              <li>
                <span>Alergénios</span>
                <strong>{product.allergens.join(", ")}</strong>
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="section-head">
        <h2>Onde comprar</h2>
        {onSale.length > 1 && <span className="muted">{onSale.length} lojas com preço</span>}
      </div>
      {offers === undefined && <p className="muted loading">A ler preços…</p>}
      {offers === null && <p className="form-error">Não deu para ler os preços deste produto.</p>}
      {offers && offers.length === 0 && <p className="empty-state">Nenhuma loja acompanhada vende este produto.</p>}
      {offers && offers.length > 0 && (
        <ul className="store-rows">
          {sorted.map((offer, index) => (
            <StoreRow
              key={offer.storeOfferId}
              offer={offer}
              index={index}
              highest={highest}
              best={isOnSale(offer) && offer.latestPrice!.price.amount === lowest && onSale.length > 1}
            />
          ))}
        </ul>
      )}

      <h2>Histórico de eventos</h2>
      <EventTimeline aggregateType="Product" aggregateId={product.productId} />
    </div>
  );
}

const availabilityLabels: Record<StoreOfferAvailability, string | null> = {
  [StoreOfferAvailability.Unknown]: null,
  [StoreOfferAvailability.InStock]: "Disponível",
  // Saiu do site (o scraper marca-a), não necessariamente esgotada.
  [StoreOfferAvailability.OutOfStock]: "Indisponível",
};

/** Uma loja: nome, barra à escala do preço mais alto, preço e veredicto; abre para o histórico. */
function StoreRow({
  offer,
  index,
  highest,
  best,
}: {
  offer: ProductStoreOfferDto;
  index: number;
  highest: number | undefined;
  best: boolean;
}) {
  const price = offer.latestPrice?.price.amount;
  const unit = unitPriceLabel(offer);
  const availability = availabilityLabels[offer.availability];
  const out = offer.availability === StoreOfferAvailability.OutOfStock;
  const width = price !== undefined && highest ? Math.max(8, (price / highest) * 100) : 0;

  return (
    <li className={`store-row${best ? " is-best" : ""}${out ? " is-out" : ""}`} style={{ "--i": Math.min(index, 12) } as CSSProperties}>
      <details>
        <summary>
          <span className="store-row-name">
            <strong>{offer.chainName}</strong>
            <span>
              {offer.storeName}
              {unit && ` · ${unit}`}
            </span>
          </span>
          <span className="store-bar" aria-hidden="true">
            {width > 0 && <span style={{ width: `${width}%` }} />}
          </span>
          <span className="store-row-price">
            {price !== undefined ? `${priceDigits(price)} €` : "—"}
            {offer.cardPrice && <small>{money.format(offer.cardPrice.amount)} com cartão</small>}
          </span>
          <span className="store-row-tag">
            {best ? (
              <VerdictBand tone="1" pill>
                Mais barato
              </VerdictBand>
            ) : out ? (
              <span className="pill pill-danger">Indisponível</span>
            ) : offer.latestPrice ? (
              <VerdictBand insight={offer.priceInsight} pill />
            ) : (
              <span className="pill pill-muted">Sem preço</span>
            )}
          </span>
        </summary>
        <div className="store-row-detail">
          <div className="label-foot">
            {offer.latestPrice && <span>Visto a {dateFormat.format(new Date(offer.latestPrice.observedAt))}</span>}
            {availability && !out && <span>{availability}</span>}
            {offer.cardPrice && <span>Cartão até {dateFormat.format(new Date(offer.cardPrice.endsAt))}</span>}
            {offer.latestPrice?.promotionId && <PromotionBadge promotionId={offer.latestPrice.promotionId} />}
          </div>
          {offer.priceInsight ? (
            <>
              <PriceRange insight={offer.priceInsight} />
              <InsightNotes insight={offer.priceInsight} />
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Sem histórico de preços nesta loja.
            </p>
          )}
        </div>
      </details>
    </li>
  );
}
