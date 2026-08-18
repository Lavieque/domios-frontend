import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchActivePromotions, searchProducts, searchRecipes } from "../api/client";
import type { PromotionDto } from "../api/types";

function daysLeftLabel(endsAt: string): { label: string; daysLeft: number } {
  const daysLeft = Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return { label: daysLeft <= 1 ? "termina amanhã" : `termina em ${daysLeft} dias`, daysLeft };
}

export function OverviewPage() {
  const [productsTotal, setProductsTotal] = useState<number | null>(null);
  const [promotionsTotal, setPromotionsTotal] = useState<number | null>(null);
  const [recipesTotal, setRecipesTotal] = useState<number | null>(null);
  const [soonPromotions, setSoonPromotions] = useState<PromotionDto[]>([]);

  useEffect(() => {
    searchProducts("", 1, 1).then((result) => setProductsTotal(result.total));
    searchRecipes("", 1, 1).then((result) => setRecipesTotal(result.total));
    searchActivePromotions(1, 100).then((result) => {
      setPromotionsTotal(result.total);
      setSoonPromotions(
        [...result.items].sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()).slice(0, 3),
      );
    });
  }, []);

  return (
    <div className="page">
      <p className="eyebrow">Visão geral</p>
      <h1>Catálogo DomiOS</h1>
      <p className="muted" style={{ maxWidth: "40rem", margin: "0 0 2rem" }}>
        Catálogo global de produtos, promoções ativas e receitas canónicas do DomiOS — leitura pública, sem posse de
        household.
      </p>

      <div className="stat-grid">
        <Link to="/produtos" className="stat-card">
          <div className="stat-value">{productsTotal ?? "—"}</div>
          <div className="stat-label">Produtos no catálogo</div>
        </Link>
        <Link to="/promocoes" className="stat-card">
          <div className="stat-value">{promotionsTotal ?? "—"}</div>
          <div className="stat-label">Promoções ativas agora</div>
        </Link>
        <Link to="/receitas" className="stat-card">
          <div className="stat-value">{recipesTotal ?? "—"}</div>
          <div className="stat-label">Receitas publicadas</div>
        </Link>
      </div>

      <h2>A terminar em breve</h2>
      {soonPromotions.length === 0 ? (
        <p className="empty-state">Sem promoções ativas neste momento.</p>
      ) : (
        <ul className="soon-list">
          {soonPromotions.map((promo) => (
            <li key={promo.promotionId}>
              <span>{promo.description}</span>
              <span className="days-left">{daysLeftLabel(promo.endsAt).label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
