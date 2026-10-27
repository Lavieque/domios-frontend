import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchMealPlanTemplates, type MealPlanTemplateSummaryDto } from "../api/mealPlanTemplates";
import { describeError } from "../auth/errors";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { ShelfLabel } from "../components/ShelfLabel";

const count = new Intl.NumberFormat("pt-PT");

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
      <p className="page-sub">Planos de uma semana, quinzena ou mês para aplicar ao teu plano a partir de um dia.</p>

      <div className="toolbar">
        <SearchField
          label="Pesquisar ementas"
          placeholder="Pesquisar ementas…"
          value={search}
          onChange={(value) => applyFilters({ search: value, page: 1 })}
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="results-count">{loading ? "A procurar…" : `${count.format(total)} ementas`}</p>

      {!loading && templates.length === 0 ? (
        <p className="empty-state">Sem ementas.</p>
      ) : (
        !loading && (
          <div className="recipe-grid">
            {templates.map((template, index) => (
              <ShelfLabel
                key={template.mealPlanTemplateId}
                to={`/ementas/${template.mealPlanTemplateId}`}
                index={index}
                className="recipe-card"
              >
                {/* Nomes compridos partem e ficam em 3 linhas; o nome inteiro fica no title. */}
                <div className="recipe-card-title clamp-3" title={template.name}>
                  {template.name}
                </div>
                {template.description && <p className="template-card-description clamp-3">{template.description}</p>}
                <div className="recipe-card-pills">
                  <span className="pill pill-accent2">
                    {template.durationDays} {template.durationDays === 1 ? "dia" : "dias"}
                  </span>
                  <span className="pill pill-muted">{template.entryCount} refeições</span>
                  <span className="pill pill-muted">{template.servingsBasis} doses</span>
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="pill pill-muted">
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && <span className="muted meal-meta">+{template.tags.length - 3}</span>}
                </div>
              </ShelfLabel>
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
    </div>
  );
}
