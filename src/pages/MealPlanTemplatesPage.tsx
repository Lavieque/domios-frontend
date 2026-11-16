import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listHouseholdMealPlanTemplates,
  searchMealPlanTemplates,
  type MealPlanTemplateSummaryDto,
} from "../api/mealPlanTemplates";
import { RecipeStatus } from "../api/types";
import { useHouseholds } from "../household/useHouseholds";
import { describeError } from "../auth/errors";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { RecipeRow } from "../components/RecipeRow";
import { templateImage } from "../plan/templateImage";
import { withoutNamePrefix } from "../plan/templates";
import { usePageSize } from "../usePageSize";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const count = numberFormat();

export function MealPlanTemplatesPage() {
  const pageSize = usePageSize(20, 10);
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
    let active = true;
    setLoading(true);
    searchMealPlanTemplates(search, page, pageSize)
      .then((result) => {
        if (!active) return;
        setTemplates(result.items);
        setTotal(result.total);
        setError(null);
      })
      .catch((err: unknown) => active && setError(describeError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, page, pageSize]);

  return (
    <div className="page templates-page">
      <header className="page-head">
        <div>
          <h1>{tr().templates.title}</h1>
          <p className="page-head-sub">{tr().templates.subtitle}</p>
        </div>
      </header>

      <MyTemplates />

      <section className="panel" aria-labelledby="templates-all">
        <div className="side-head">
          <h2 id="templates-all">{tr().templates.all}</h2>
          {!loading && !error && (
            <span className="side-head-count">
              {tr().templates.count(count.format(total), total, Boolean(search))}
            </span>
          )}
        </div>
        <div className="toolbar">
          <SearchField
            label={tr().templates.search}
            placeholder={tr().templates.searchPlaceholder}
            value={search}
            onChange={(value) => applyFilters({ search: value, page: 1 })}
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="muted loading">{tr().lists2.searching}</p>}
        {!loading && !error && templates.length === 0 && (
          <p className="empty-state">{search ? tr().templates.noneFound : tr().templates.nonePublished}</p>
        )}
        {!loading && !error && templates.length > 0 && (
          <ul className="recipe-rows">
            {templates.map((template) => (
              <TemplateRow key={template.mealPlanTemplateId} template={template} />
            ))}
          </ul>
        )}
      </section>

      {!error && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />}
    </div>
  );
}

/** Uma ementa numa linha: os dias na coluna fixa, como o número de um dia; o nome é a interface. */
function TemplateRow({ template, note }: { template: MealPlanTemplateSummaryDto; note?: string }) {
  const description = template.description ? withoutNamePrefix(template.description, template.name) : null;
  return (
    <RecipeRow
      title={template.name}
      to={`/ementas/${template.mealPlanTemplateId}`}
      imageUrl={template.imageUrl ?? templateImage(template.tags)}
      lead={
        <>
          <span className="list-tally-count">{template.durationDays}</span>
          <span className="recipe-row-lead-label">{tr().templates.days(template.durationDays)}</span>
        </>
      }
    >
      <span className="recipe-row-meta">
        {[
          tr().templates.meals(template.entryCount),
          tr().templates.servings(template.servingsBasis),
          note ?? null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {description && <span className="recipe-row-desc">{description}</span>}
      {template.tags.length > 0 && (
        <span className="recipe-row-tags">
          {template.tags.slice(0, 4).join(", ")}
          {template.tags.length > 4 && tr().lists2.andMore(template.tags.length - 4)}
        </span>
      )}
    </RecipeRow>
  );
}

/** As ementas da casa (as cópias personalizadas incluídas); sem nenhuma, não aparece. */
function MyTemplates() {
  const { current } = useHouseholds();
  const [mine, setMine] = useState<MealPlanTemplateSummaryDto[]>([]);

  useEffect(() => {
    if (!current) return;
    let active = true;
    listHouseholdMealPlanTemplates(current.householdId)
      .then((result) => active && setMine(result.items.filter((t) => t.status !== RecipeStatus.Archived)))
      .catch(() => active && setMine([]));
    return () => {
      active = false;
    };
  }, [current]);

  if (mine.length === 0) return null;

  return (
    <section className="panel" aria-labelledby="templates-mine">
      <h2 id="templates-mine">{tr().templates.mine}</h2>
      <ul className="recipe-rows">
        {mine.map((template) => (
          <TemplateRow
            key={template.mealPlanTemplateId}
            template={template}
            note={template.status === RecipeStatus.Draft ? tr().templates.editable : undefined}
          />
        ))}
      </ul>
    </section>
  );
}
