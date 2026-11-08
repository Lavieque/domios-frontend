import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { listCookedRecipes, saveRecipe, type CookedRecipeDto } from "../api/savedRecipes";
import { describeError } from "../auth/errors";
import { Pagination } from "../components/Pagination";
import { RecipeThumb } from "../components/RecipeThumb";
import { HouseholdGate } from "../household/HouseholdGate";
import { longDate, type IsoDate } from "../plan/dates";

const PAGE_SIZE = 20;

export function CookedRecipesPage() {
  return <HouseholdGate>{(household) => <Cooked household={household} />}</HouseholdGate>;
}

/** O dia local de um instante, para mostrar "a 3 de novembro". */
function localDay(instant: string): IsoDate {
  const date = new Date(instant);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as IsoDate;
}

/** As receitas que a casa já fez: quantas vezes e a última. */
function Cooked({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const [items, setItems] = useState<CookedRecipeDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    listCookedRecipes(householdId, page, PAGE_SIZE)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [householdId, page]);

  async function save(recipeId: string) {
    setError(null);
    try {
      await saveRecipe(householdId, recipeId);
      setItems((current) => current?.map((item) => (item.recipeId === recipeId ? { ...item, isSaved: true } : item)) ?? null);
    } catch (err) {
      setError(describeError(err, { "saved-recipes-limit": "Já tens 500 receitas guardadas. Remove algumas primeiro." }));
    }
  }

  return (
    <div className="page">
      <nav className="crumb" aria-label="Caminho">
        <Link to="/cozinhar" className="back-link">
          O que posso cozinhar
        </Link>
      </nav>
      <h1>Receitas feitas</h1>
      <p className="page-sub">O que já se cozinhou em {household.name}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {items === null && !error && <p className="muted loading">A carregar…</p>}
      {items !== null && items.length === 0 && (
        <p className="empty-state">
          Ainda não registaste nenhuma refeição a partir de uma receita. Quando cozinhares uma do plano ou da página da
          receita, aparece aqui.
        </p>
      )}

      {items !== null && items.length > 0 && (
        <section className="panel">
          <ul className="suggestion-list">
            {items.map((item) => (
              <li key={item.recipeId} className="recipe-row">
                <RecipeThumb recipeId={item.recipeId} imageUrl={item.imageUrl} linked={item.isReadable} />
                <div className="recipe-row-body">
                  {item.isReadable ? (
                    <Link to={`/receitas/${item.recipeId}`} className="meal-title">
                      {item.title}
                    </Link>
                  ) : (
                    <span className="meal-title">{item.title}</span>
                  )}
                  <div className="recipe-card-pills">
                    <span className="pill pill-accent2">
                      {item.timesCooked} {item.timesCooked === 1 ? "vez" : "vezes"}
                    </span>
                    <span className="pill pill-muted">Última a {longDate(localDay(item.lastCookedAt))}</span>
                    {item.isSaved && <span className="pill pill-muted">Guardada</span>}
                  </div>
                  {item.isReadable && !item.isSaved && (
                    <div>
                      <button type="button" className="link-button" onClick={() => save(item.recipeId)}>
                        Guardar para fazer outra vez
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(next) => setSearchParams(next > 1 ? { page: String(next) } : {}, { replace: true })}
      />
    </div>
  );
}
