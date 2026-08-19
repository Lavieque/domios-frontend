import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, getProductStoreOffers } from "../api/client";
import { measurementUnitLabels, type ProductDto, type ProductStoreOfferDto } from "../api/types";
import { PromotionBadge } from "../components/PromotionBadge";
import { EventTimeline } from "../components/EventTimeline";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [offers, setOffers] = useState<ProductStoreOfferDto[] | null>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id).then(setProduct);
    getProductStoreOffers(id).then(setOffers);
  }, [id]);

  if (!id) return null;
  if (!product) return <p className="muted loading">A carregar…</p>;

  const lowestPrice =
    offers && offers.length > 0
      ? Math.min(...offers.filter((o) => o.latestPrice).map((o) => o.latestPrice!.price.amount))
      : null;

  return (
    <div className="page">
      <p>
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          &larr; Produtos
        </button>
      </p>
      <p className="eyebrow" style={{ margin: "0.75rem 0 0.5rem" }}>
        Produto
      </p>
      <h1>{product.name}</h1>

      <div className="meta-grid">
        <div className="meta-field">
          <div className="meta-field-label">Marca</div>
          <div className="meta-field-value">{product.brand ?? "Sem marca"}</div>
        </div>
        <div className="meta-field">
          <div className="meta-field-label">Categoria</div>
          <div className="meta-field-value">{product.category.name}</div>
        </div>
        <div className="meta-field">
          <div className="meta-field-label">Embalagem</div>
          <div className="meta-field-value" style={{ fontFamily: "var(--font-mono)" }}>
            {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
          </div>
        </div>
        <div className="meta-field">
          <div className="meta-field-label">EAN</div>
          <div className="meta-field-value" style={{ fontFamily: "var(--font-mono)" }}>
            {product.barcode ?? "—"}
          </div>
        </div>
      </div>

      {product.imageUrl && <img className="product-image" src={product.imageUrl} alt={product.name} />}

      <h2>Preços por cadeia</h2>
      {offers === null && <p className="muted loading">A carregar preços…</p>}
      {offers !== null && offers.length === 0 && <p className="empty-state">Sem ofertas registadas.</p>}
      {offers !== null && offers.length > 0 && (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Cadeia</th>
                <th>Loja</th>
                <th>Preço</th>
                <th>Observado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const isLowest = offer.latestPrice !== null && offer.latestPrice.price.amount === lowestPrice;
                return (
                  <tr key={offer.storeOfferId} className={isLowest ? "offer-lowest" : undefined}>
                    <td>{offer.chainName}</td>
                    <td>{offer.storeName}</td>
                    <td className={`price${offer.latestPrice?.promotionId ? " is-promo" : ""}`}>
                      {offer.latestPrice ? `${offer.latestPrice.price.amount.toFixed(2)} ${offer.latestPrice.price.currency}` : "—"}
                      {isLowest && <span className="lowest-tag">mais barato</span>}
                    </td>
                    <td className="num">{offer.latestPrice ? new Date(offer.latestPrice.observedAt).toLocaleDateString("pt-PT") : "—"}</td>
                    <td>{offer.latestPrice?.promotionId && <PromotionBadge promotionId={offer.latestPrice.promotionId} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2>Histórico</h2>
      <EventTimeline aggregateType="Product" aggregateId={product.productId} />
    </div>
  );
}
