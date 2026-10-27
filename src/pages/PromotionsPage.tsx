import { useEffect, useState } from "react";
import { searchActivePromotions } from "../api/client";
import type { PromotionDto } from "../api/types";
import { Pagination } from "../components/Pagination";
import { PromotionLabel } from "../components/PromotionLabel";

const count = new Intl.NumberFormat("pt-PT");

export function PromotionsPage() {
  const [page, setPage] = useState(1);
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
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
      <h1>Promoções ativas</h1>
      <p className="page-sub">
        {total === null ? "A contar…" : `${count.format(total)} promoções em vigor nas lojas acompanhadas`}
      </p>

      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && promotions.length === 0 ? (
        <p className="empty-state">Sem promoções ativas neste momento.</p>
      ) : (
        !loading && (
          <div className="label-grid">
            {promotions.map((promotion, index) => (
              <PromotionLabel key={promotion.promotionId} promotion={promotion} index={index} />
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={20} total={total ?? 0} onPageChange={setPage} />
    </div>
  );
}
