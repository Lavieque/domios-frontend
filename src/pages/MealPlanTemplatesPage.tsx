import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchMealPlanTemplates, type MealPlanTemplateSummaryDto } from "../api/mealPlanTemplates";
import { describeError } from "../auth/errors";
import { Pagination } from "../components/Pagination";

export function MealPlanTemplatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [templates, setTemplates] = useState<MealPlanTemplateSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyFilters(next: { search?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? page;
    if (nextSearch) params.set("search", nextSearch);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    setLoading(true);
    searchMealPlanTemplates(search, page)
      .then((result) => {
        setTemplates(result.items);
        setTotal(result.total);
        setError(null);
      })
      .catch((err: unknown) => setError(describeError(err)))
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div className="page">
      <h1>Ementas prontas</h1>
      <p className="muted">Planos de uma semana, quinzena ou mês para aplicar ao teu plano a partir de um dia.</p>
      <div className="search-wrap">
        <input
          type="search"
          placeholder="Pesquisar ementas…"
          value={search}
          onChange={(e) => applyFilters({ search: e.target.value, page: 1 })}
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && templates.length === 0 ? (
        <p className="empty-state">Sem ementas.</p>
      ) : (
        !loading && (
          <div className="recipe-grid">
            {templates.map((template) => (
              <Link
                key={template.mealPlanTemplateId}
                to={`/ementas/${template.mealPlanTemplateId}`}
                className="recipe-card"
              >
                <div className="recipe-card-title">{template.name}</div>
                {template.description && <p className="muted template-card-description">{template.description}</p>}
                <div className="recipe-card-pills">
                  <span className="pill pill-accent2">
                    {template.durationDays} {template.durationDays === 1 ? "dia" : "dias"}
                  </span>
                  <span className="pill pill-muted">{template.entryCount} refeições</span>
                  <span className="pill pill-muted">{template.servingsBasis} doses</span>
                  {template.tags.map((tag) => (
                    <span key={tag} className="pill pill-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
    </div>
  );
}
