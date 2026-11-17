import { PageSkeleton } from "../components/PageSkeleton";
import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../api/client";
import { PaidPriceSource } from "../api/shopping";
import { addShoppingListItem } from "../api/shopping";
import { getProductPurchases, type ProductPurchaseDto } from "../api/spending";
import {
  MeasurementUnit,
  ProductStatus,
  StoreOfferAvailability,
  type ProductDto,
  type ProductStoreOfferDto,
} from "../api/types";
import { topCategory } from "../catalog/aisles";
import { allergenLabel, formatPackage } from "../catalog/package";
import { isOnSale, money, priceDigits, sortOffers, unitPriceLabel, useOffers } from "../catalog/offers";
import { useCategories } from "../catalog/useCategories";
import { EventTimeline } from "../components/EventTimeline";
import { PromotionBadge } from "../components/PromotionBadge";
import { SendToListForm } from "../components/SendToListForm";
import { InsightNotes, LabelPrice, PriceRange, VerdictBand } from "../components/ShelfLabel";
import { useHouseholds } from "../household/useHouseholds";
import { dateTimeFormat } from "../i18n/format";
import { tr } from "../i18n";
import { PriceHistory } from "../components/PriceHistory";
import { localized } from "../i18n";

const dateFormat = dateTimeFormat({
  day: "numeric",
  month: "short",
});

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const offers = useOffers(id ?? "");
  const categories = useCategories();
  const { current } = useHouseholds();
  const lastPaid = useLastPaid(current?.householdId ?? null, id ?? null);

  useEffect(() => {
    if (!id) return;
    setProduct(null);
    getProduct(id).then(setProduct);
  }, [id]);

  if (!id) return null;
  if (!product) return <PageSkeleton />;

  const sorted = offers ? sortOffers(offers) : [];
  const onSale = sorted.filter(isOnSale);
  const cheapest = onSale[0];
  const lowest = cheapest?.latestPrice?.price.amount;
  const highest = onSale[onSale.length - 1]?.latestPrice?.price.amount;
  const top = topCategory(product.category, categories) ?? product.category;
  const unit = cheapest ? unitPriceLabel(cheapest) : null;
  const pack = formatPackage(product.packageQuantity, product.packageUnit);

  return (
    <div className="page">
      <nav className="crumb" aria-label={tr().common.breadcrumb}>
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          {tr().products.back}
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

      {/* O artigo como folha: o preço na coluna fixa, o nome à direita de um filete. */}
      <section className="article-sheet">
        <div className="article-sheet-price">
          {offers === undefined ? (
            <LabelPrice amount={undefined} />
          ) : (
            <LabelPrice amount={lowest ?? null} from={onSale.length > 1 && highest !== lowest} />
          )}
          {cheapest && (
            <>
              <VerdictBand insight={cheapest.priceInsight} />
              <span className="article-unit">
                {unit && <strong>{unit}</strong>}
                {unit && <br />}
                {cheapest.chainName}
                {cheapest.cardPrice && (
                  <>
                    <br />
                    {tr().products.withCard(money.format(cheapest.cardPrice.amount))}
                  </>
                )}
              </span>
            </>
          )}
        </div>

        <div className="article-sheet-body">
          <h1 className="article-name">{product.name}</h1>
          <p className="article-brand">
            {product.brand ?? tr().products.noBrand} · {pack}
          </p>

          {product.imageUrl && (
            <div className="article-photo">
              <img src={product.imageUrl} alt={product.name} />
            </div>
          )}

          {product.status === ProductStatus.Active ? (
            <div className="article-actions">
              <Link to={`/despensa/adicionar?produto=${product.productId}`} className="button-primary">
                {tr().products.addToPantry}
              </Link>
              {current && (
                <SendToListForm
                  householdId={current.householdId}
                  newListName={tr().products.defaultListName}
                  submitLabel={tr().products.addToList}
                  send={async (listId) => ({
                    list: await addShoppingListItem(current.householdId, listId, {
                      label: product.name,
                      quantity: { amount: 1, unit: MeasurementUnit.Unit },
                      productId: product.productId,
                    }),
                    added: 1,
                  })}
                />
              )}
            </div>
          ) : (
            <p className="notice article-notice">
              {tr().products.discontinuedNotice}
              {product.substitutedByProductId && (
                <>
                  {" "}
                  <Link to={`/produtos/${product.substitutedByProductId}`}>{tr().products.seeReplacement}</Link>
                </>
              )}
            </p>
          )}

          {lastPaid && <LastPaid purchase={lastPaid} product={product} />}

          {cheapest?.priceInsight && (
            <div className="article-insight">
              <PriceRange insight={cheapest.priceInsight} />
              <InsightNotes insight={cheapest.priceInsight} />
            </div>
          )}

          <dl className="article-specs">
            <div>
              <dt>{tr().products.category}</dt>
              <dd>{product.category.name}</dd>
            </div>
            <div>
              <dt>{tr().products.package}</dt>
              <dd>{pack}</dd>
            </div>
            <div>
              <dt>{tr().products.ean}</dt>
              <dd>{product.barcode ?? "—"}</dd>
            </div>
            {product.allergens.length > 0 && (
              <div>
                <dt>{tr().products.allergens}</dt>
                <dd>{product.allergens.map(allergenLabel).join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="panel article-stores" aria-labelledby="article-stores-title">
        <div className="side-head">
          <h2 id="article-stores-title">{tr().products.whereToBuy}</h2>
          {onSale.length > 1 && <span className="side-head-count">{tr().products.storesWithPrice(onSale.length)}</span>}
        </div>
        {offers === undefined && <p className="muted loading">{tr().ui.price.reading}</p>}
        {offers === null && <p className="form-error">{tr().products.readFailed}</p>}
        {offers && offers.length === 0 && <p className="empty-state">{tr().products.noStores}</p>}
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
      </section>

      <section className="panel" aria-labelledby="article-history-title">
        <h2 id="article-history-title">{tr().products.history}</h2>
        <EventTimeline aggregateType="Product" aggregateId={product.productId} />
      </section>
    </div>
  );
}

const availabilityLabels: Record<StoreOfferAvailability, string | null> = localized((t) => ({
  [StoreOfferAvailability.Unknown]: null,
  [StoreOfferAvailability.InStock]: t.products.inStock,
  // Saiu do site (o scraper marca-a), não necessariamente esgotada.
  [StoreOfferAvailability.OutOfStock]: t.products.outOfStock,
}));

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
  // O histórico só se pede quando a loja se abre.
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`store-row${best ? " is-best" : ""}${out ? " is-out" : ""}`}
      style={{ "--i": Math.min(index, 12) } as CSSProperties}
    >
      <details onToggle={(event) => setOpen(event.currentTarget.open)}>
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
            {price !== undefined ? <span className={best ? "price-tag" : undefined}>{priceDigits(price)} €</span> : "—"}
            {offer.cardPrice && <small>{money.format(offer.cardPrice.amount)} {tr().ui.price.withCard}</small>}
          </span>
          <span className="store-row-tag">
            {best ? (
              <VerdictBand tone="1">{tr().products.cheapest}</VerdictBand>
            ) : out ? (
              <VerdictBand tone="none">{tr().products.outOfStock}</VerdictBand>
            ) : offer.latestPrice ? (
              <VerdictBand insight={offer.priceInsight} />
            ) : (
              <VerdictBand tone="none">{tr().products.noPrice}</VerdictBand>
            )}
          </span>
        </summary>
        <div className="store-row-detail">
          <div className="label-foot">
            {offer.latestPrice && <span>{tr().products.seenOn(dateFormat.format(new Date(offer.latestPrice.observedAt)))}</span>}
            {availability && !out && <span>{availability}</span>}
            {offer.cardPrice && <span>{tr().products.cardUntil(dateFormat.format(new Date(offer.cardPrice.endsAt)))}</span>}
            {offer.latestPrice?.promotionId && <PromotionBadge promotionId={offer.latestPrice.promotionId} />}
          </div>
          {offer.priceInsight ? (
            <>
              <PriceRange insight={offer.priceInsight} />
              <InsightNotes insight={offer.priceInsight} />
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              {tr().products.noStoreHistory}
            </p>
          )}
          {open && offer.latestPrice && <PriceHistory storeId={offer.storeId} storeOfferId={offer.storeOfferId} />}
        </div>
      </details>
    </li>
  );
}

/** A última compra deste produto pela casa com preço; null sem casa, sem compras ou se falhar. */
function useLastPaid(householdId: string | null, productId: string | null): ProductPurchaseDto | null {
  const [purchase, setPurchase] = useState<ProductPurchaseDto | null>(null);
  useEffect(() => {
    setPurchase(null);
    if (!householdId || !productId) return;
    let active = true;
    getProductPurchases(householdId, productId, 10)
      .then((result) => active && setPurchase(result.items.find((p) => p.paidPrice?.currency === "EUR") ?? null))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [householdId, productId]);
  return purchase;
}

/** "Pagaste 1,29 € a 2 nov. no Continente" (DomiOS_API_Fase1.md, adenda 2026-11-09). */
function LastPaid({ purchase, product }: { purchase: ProductPurchaseDto; product: ProductDto }) {
  const where = purchase.physicalStoreName ?? purchase.chainName;
  const total = purchase.paidPrice!.amount;
  // O preço pago é o da linha toda; com várias embalagens, mostra também o de cada uma, como a prateleira.
  const packs = packagesOf(purchase.quantity.amount, purchase.quantity.unit, product.packageQuantity, product.packageUnit);
  return (
    <p className="muted last-paid">
      {tr().products.youPaid}{" "}
      {packs !== null && packs > 1 ? (
        <>
          <strong>{money.format(total / packs)}</strong>
          {tr().products.perPack(money.format(total), packs)}
        </>
      ) : (
        <strong>{money.format(total)}</strong>
      )}{" "}
      {tr().products.on(dateFormat.format(new Date(purchase.purchasedAt)))}
      {where && tr().products.at(where)}
      {purchase.paidPriceSource === PaidPriceSource.Offer && tr().products.shelfPrice}.
    </p>
  );
}

/** Embalagens inteiras numa compra; null quando a unidade não se compara com a da embalagem. */
function packagesOf(amount: number, unit: MeasurementUnit, packageQuantity: number, packageUnit: MeasurementUnit): number | null {
  if (unit === MeasurementUnit.Unit) return Math.max(1, Math.round(amount));
  const base = (u: MeasurementUnit, q: number) =>
    u === MeasurementUnit.Kilogram ? { dim: "g", q: q * 1000 } : u === MeasurementUnit.Liter ? { dim: "ml", q: q * 1000 } : { dim: u === MeasurementUnit.Gram ? "g" : "ml", q };
  const bought = base(unit, amount);
  const pack = base(packageUnit, packageQuantity);
  if (packageUnit === MeasurementUnit.Unit || bought.dim !== pack.dim || !(pack.q > 0)) return null;
  return Math.max(1, Math.ceil(bought.q / pack.q - 1e-9));
}
