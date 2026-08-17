import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct, getProductStoreOffers } from "../api/client";
import { measurementUnitLabels, type ProductDto, type ProductStoreOfferDto } from "../api/types";
import { PromotionBadge } from "../components/PromotionBadge";
import { EventTimeline } from "../components/EventTimeline";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [offers, setOffers] = useState<ProductStoreOfferDto[] | null>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id).then(setProduct);
    getProductStoreOffers(id).then(setOffers);
  }, [id]);

  if (!id) return null;
  if (!product) return <p className="muted loading">A carregar…</p>;

  return (
    <div className="page">
      <p>
        <Link to="/produtos">&larr; Produtos</Link>
      </p>
      <h1>{product.name}</h1>
      <p className="muted">
        {product.brand ?? "Sem marca"} · {product.category.name} · {product.packageQuantity}{" "}
        {measurementUnitLabels[product.packageUnit]}
        {product.barcode && <> · EAN {product.barcode}</>}
      </p>
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
              {offers.map((offer) => (
                <tr key={offer.storeOfferId}>
                  <td>{offer.chainName}</td>
                  <td>{offer.storeName}</td>
                  <td className={`price${offer.latestPrice?.promotionId ? " is-promo" : ""}`}>
                    {offer.latestPrice ? `${offer.latestPrice.price.amount.toFixed(2)} ${offer.latestPrice.price.currency}` : "—"}
                  </td>
                  <td className="num">{offer.latestPrice ? new Date(offer.latestPrice.observedAt).toLocaleDateString("pt-PT") : "—"}</td>
                  <td>{offer.latestPrice?.promotionId && <PromotionBadge promotionId={offer.latestPrice.promotionId} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Histórico</h2>
      <EventTimeline aggregateType="Product" aggregateId={product.productId} />
    </div>
  );
}
