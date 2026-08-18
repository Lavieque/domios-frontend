import { useEffect, useState } from "react";
import { searchActivePromotions } from "../api/client";
import { promotionTypeLabels, type PromotionDto } from "../api/types";
import { Pagination } from "../components/Pagination";

function daysLeft(promotion: PromotionDto): number {
  return Math.ceil((new Date(promotion.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function PromotionsPage() {
  const [page, setPage] = useState(1);
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchActivePromotions(page)
      .then((result) => {
        setPromotions(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page">
      <p className="eyebrow">Oportunidades</p>
      <h1>Promoções ativas</h1>

      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && promotions.length === 0 ? (
        <p className="empty-state">Sem promoções ativas neste momento.</p>
      ) : (
        !loading && (
          <div className="promo-list">
            {promotions.map((promotion) => {
              const remaining = daysLeft(promotion);
              return (
                <div key={promotion.promotionId} className="promo-card">
                  <div>
                    <span className="promo-type">{promotionTypeLabels[promotion.type]}</span>
                    <div className="promo-description">{promotion.description}</div>
                    <div className="promo-meta">
                      {new Date(promotion.startsAt).toLocaleDateString("pt-PT")} —{" "}
                      {new Date(promotion.endsAt).toLocaleDateString("pt-PT")}
                      {promotion.requiresCard && <> · exige cartão</>}
                    </div>
                  </div>
                  <div className={`promo-days${remaining <= 2 ? " is-urgent" : ""}`}>
                    {remaining <= 1 ? "termina amanhã" : `termina em ${remaining} dias`}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
