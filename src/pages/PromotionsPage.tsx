import { useEffect, useState } from "react";
import { searchActivePromotions } from "../api/client";
import { promotionTypeLabels, type PromotionDto } from "../api/types";
import { Pagination } from "../components/Pagination";

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
      <h1>Promoções ativas</h1>

      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && promotions.length === 0 ? (
        <p className="empty-state">Sem promoções ativas neste momento.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Exige cartão</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion.promotionId}>
                <td>{promotionTypeLabels[promotion.type]}</td>
                <td>{promotion.description}</td>
                <td className="num">{new Date(promotion.startsAt).toLocaleDateString("pt-PT")}</td>
                <td className="num">{new Date(promotion.endsAt).toLocaleDateString("pt-PT")}</td>
                <td>{promotion.requiresCard ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
