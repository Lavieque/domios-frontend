import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { listCookedRecipes, saveRecipe, type CookedRecipeDto } from "../api/savedRecipes";
import { describeError } from "../auth/errors";
import { Pagination } from "../components/Pagination";
import { RecipeRow } from "../components/RecipeRow";
import { HouseholdGate } from "../household/HouseholdGate";
import { localDay, longDate } from "../plan/dates";
import { usePageSize } from "../usePageSize";
import { tr } from "../i18n";

export function CookedRecipesPage() {
  return <HouseholdGate>{(household) => <Cooked household={household} />}</HouseholdGate>;
}

/** As receitas que a casa já fez: quantas vezes e a última. */
function Cooked({ household }: { household: CallerHouseholdDto }) {
  const pageSize = usePageSize(20, 10);
  const householdId = household.householdId;
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const [items, setItems] = useState<CookedRecipeDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    listCookedRecipes(householdId, page, pageSize)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [householdId, page, pageSize]);

  async function save(recipeId: string) {
    setError(null);
    try {
      await saveRecipe(householdId, recipeId);
      setItems((current) => current?.map((item) => (item.recipeId === recipeId ? { ...item, isSaved: true } : item)) ?? null);
    } catch (err) {
      setError(describeError(err, { "saved-recipes-limit": tr().ui.saveRecipe.limit }));
    }
  }

  return (
    <div className="page cooked-page">
      <nav className="crumb" aria-label={tr().common.breadcrumb}>
        <Link to="/cozinhar" className="back-link">
          {tr().cooked.back}
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>{tr().cooked.title}</h1>
          <p className="page-head-sub">{tr().cooked.subtitle(household.name)}</p>
        </div>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {items === null && !error && <p className="muted loading">{tr().common.loading}</p>}
      {items !== null && items.length === 0 && (
        <p className="empty-state">
          {tr().cooked.empty}
        </p>
      )}

      {items !== null && items.length > 0 && (
        <ul className="recipe-rows">
          {items.map((item) => (
            <RecipeRow
              key={item.recipeId}
              title={item.title}
              to={item.isReadable ? `/receitas/${item.recipeId}` : undefined}
              imageUrl={item.imageUrl}
              lead={
                <>
                  <span className="list-tally-count">{item.timesCooked}</span>
                  <span className="recipe-row-lead-label">{tr().cooked.times(item.timesCooked)}</span>
                </>
              }
              action={
                item.isReadable && !item.isSaved ? (
                  <button type="button" className="link-button" onClick={() => save(item.recipeId)}>
                    {tr().cooked.saveAgain}
                  </button>
                ) : undefined
              }
            >
              <span className="recipe-row-meta">
                {[tr().cooked.last(longDate(localDay(item.lastCookedAt))), item.isSaved ? tr().cooked.saved : null, item.isReadable ? null : tr().cooked.unavailable]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </RecipeRow>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(next) => setSearchParams(next > 1 ? { page: String(next) } : {}, { replace: true })}
      />
    </div>
  );
}
