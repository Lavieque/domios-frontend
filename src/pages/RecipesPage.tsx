import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchRecipes } from "../api/client";
import {
  DishType,
  dishTypeLabels,
  MainProtein,
  mainProteinLabels,
  recipeDifficultyLabels,
  type RecipeSummaryDto,
} from "../api/types";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { ShelfLabel } from "../components/ShelfLabel";

const count = new Intl.NumberFormat("pt-PT");
const dishTypes = Object.values(DishType) as DishType[];
const proteins = Object.values(MainProtein) as MainProtein[];

function parseEnum<T extends number>(value: string | null, allowed: T[]): T | undefined {
  if (value === null) return undefined;
  const n = Number(value) as T;
  return allowed.includes(n) ? n : undefined;
}

export function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const dishType = parseEnum(searchParams.get("prato"), dishTypes);
  const mainProtein = parseEnum(searchParams.get("proteina"), proteins);

  const [recipes, setRecipes] = useState<RecipeSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  function applyFilters(next: { search?: string; page?: number; dishType?: DishType | null; mainProtein?: MainProtein | null }) {
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? page;
    const nextDish = next.dishType === undefined ? dishType : next.dishType;
    const nextProtein = next.mainProtein === undefined ? mainProtein : next.mainProtein;

    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextDish !== undefined && nextDish !== null) params.set("prato", String(nextDish));
    if (nextProtein !== undefined && nextProtein !== null) params.set("proteina", String(nextProtein));
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    setLoading(true);
    searchRecipes(search, page, 20, { dishType, mainProtein })
      .then((result) => {
        setRecipes(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, dishType, mainProtein]);

  return (
    <div className="page">
      <h1>Receitas</h1>
      <p className="page-sub">Receitas publicadas, para cozinhar, planear ou pôr na lista.</p>

      <div className="toolbar">
        <SearchField
          label="Pesquisar receitas"
          placeholder="Pesquisar receitas…"
          value={search}
          onChange={(value) => applyFilters({ search: value, page: 1 })}
        />
        <select
          className="category-select"
          aria-label="Tipo de prato"
          value={dishType ?? ""}
          onChange={(e) => applyFilters({ dishType: e.target.value === "" ? null : (Number(e.target.value) as DishType), page: 1 })}
        >
          <option value="">Todos os pratos</option>
          {dishTypes.map((type) => (
            <option key={type} value={type}>
              {dishTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="chip-row" role="group" aria-label="Proteína principal">
        <button type="button" className="chip" aria-pressed={mainProtein === undefined} onClick={() => applyFilters({ mainProtein: null, page: 1 })}>
          Todas
        </button>
        {proteins.map((protein) => (
          <button
            key={protein}
            type="button"
            className="chip"
            aria-pressed={mainProtein === protein}
            onClick={() => applyFilters({ mainProtein: mainProtein === protein ? null : protein, page: 1 })}
          >
            {mainProteinLabels[protein]}
          </button>
        ))}
      </div>

      <p className="results-count">{loading ? "A procurar…" : `${count.format(total)} receitas`}</p>

      {!loading && recipes.length === 0 ? (
        <p className="empty-state">Sem receitas com estes filtros.</p>
      ) : (
        !loading && (
          <div className="recipe-grid">
            {recipes.map((recipe, index) => (
              <ShelfLabel
                key={recipe.recipeId}
                to={`/receitas/${recipe.recipeId}`}
                index={index}
                className="recipe-card"
                media={
                  recipe.imageUrl ? (
                    <div className="recipe-photo">
                      <img src={recipe.imageUrl} alt="" loading="lazy" />
                    </div>
                  ) : undefined
                }
              >
                <div className="recipe-card-title">{recipe.title}</div>
                <div className="label-meta">
                  {[
                    recipe.dishType !== null ? dishTypeLabels[recipe.dishType] : null,
                    recipe.mainProtein !== null ? mainProteinLabels[recipe.mainProtein] : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Receita"}
                </div>
                <div className="recipe-card-pills">
                  <span className="pill pill-accent2">{recipeDifficultyLabels[recipe.difficulty]}</span>
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="pill pill-muted">
                      {tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && <span className="muted meal-meta">+{recipe.tags.length - 3}</span>}
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
