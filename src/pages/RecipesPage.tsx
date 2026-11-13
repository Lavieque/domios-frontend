import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchRecipes } from "../api/client";
import {
  DishType,
  dishTypeLabels,
  MainProtein,
  mainProteinLabels,
  RecipeDifficulty,
  recipeDifficultyLabels,
  type RecipeSummaryDto,
} from "../api/types";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { describeError } from "../auth/errors";
import { FeatureCard } from "../components/FeatureCard";
import { RecipeRow } from "../components/RecipeRow";
import { usePageSize } from "../usePageSize";

const count = new Intl.NumberFormat("pt-PT");
const dishTypes = Object.values(DishType) as DishType[];
const proteins = Object.values(MainProtein) as MainProtein[];
const difficulties = Object.values(RecipeDifficulty) as RecipeDifficulty[];

function parseEnum<T extends number>(value: string | null, allowed: T[]): T | undefined {
  if (value === null) return undefined;
  const n = Number(value) as T;
  return allowed.includes(n) ? n : undefined;
}

export function RecipesPage() {
  const pageSize = usePageSize(20, 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const dishType = parseEnum(searchParams.get("prato"), dishTypes);
  const mainProtein = parseEnum(searchParams.get("proteina"), proteins);
  const difficulty = parseEnum(searchParams.get("dificuldade"), difficulties);

  const [recipes, setRecipes] = useState<RecipeSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtered = search !== "" || dishType !== undefined || mainProtein !== undefined || difficulty !== undefined;

  function applyFilters(next: {
    search?: string;
    page?: number;
    dishType?: DishType | null;
    mainProtein?: MainProtein | null;
    difficulty?: RecipeDifficulty | null;
  }) {
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? page;
    const nextDish = next.dishType === undefined ? dishType : next.dishType;
    const nextProtein = next.mainProtein === undefined ? mainProtein : next.mainProtein;
    const nextDifficulty = next.difficulty === undefined ? difficulty : next.difficulty;

    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextDish !== undefined && nextDish !== null) params.set("prato", String(nextDish));
    if (nextProtein !== undefined && nextProtein !== null) params.set("proteina", String(nextProtein));
    if (nextDifficulty !== undefined && nextDifficulty !== null) params.set("dificuldade", String(nextDifficulty));
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    searchRecipes(search, page, pageSize, { dishType, mainProtein, difficulty })
      .then((result) => {
        if (!active) return;
        setRecipes(result.items);
        setTotal(result.total);
      })
      .catch((err: unknown) => active && setError(describeError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, page, pageSize, dishType, mainProtein, difficulty]);

  // O total só se diz quando a Api o deu; com filtros é o que eles encontram, não o catálogo.
  const countLine = loading
    ? "A procurar…"
    : error
      ? "Para cozinhar, planear ou pôr na lista"
      : filtered
        ? `${count.format(total)} ${total === 1 ? "receita" : "receitas"} com estes filtros`
        : `${count.format(total)} receitas publicadas, para cozinhar, planear ou pôr na lista`;

  return (
    <div className="page recipes-page">
      <header className="page-head">
        <div>
          <h1>Receitas</h1>
          <p className="page-head-sub" aria-live="polite">
            {countLine}
          </p>
        </div>
      </header>

      {!filtered && page === 1 && !loading && recipes[0] && (
        <FeatureCard
          eyebrow="Da nossa seleção"
          title={recipes[0].title}
          meta={[
            recipes[0].dishType !== null ? dishTypeLabels[recipes[0].dishType] : null,
            recipeDifficultyLabels[recipes[0].difficulty],
          ]
            .filter(Boolean)
            .join(" · ")}
          imageUrl={recipes[0].imageUrl}
          to={`/receitas/${recipes[0].recipeId}`}
        />
      )}

      <div className="section-head section-head-loose">
        <h2>Explorar receitas</h2>
      </div>

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
        <select
          className="category-select"
          aria-label="Dificuldade"
          value={difficulty ?? ""}
          onChange={(e) =>
            applyFilters({ difficulty: e.target.value === "" ? null : (Number(e.target.value) as RecipeDifficulty), page: 1 })
          }
        >
          <option value="">Qualquer dificuldade</option>
          {difficulties.map((level) => (
            <option key={level} value={level}>
              {recipeDifficultyLabels[level]}
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

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {error ? null : !loading && recipes.length === 0 ? (
        <p className="empty-state">Sem receitas com estes filtros.</p>
      ) : (
        !loading && (
          <ul className="recipe-rows">
            {recipes.map((recipe) => (
              <RecipeRow key={recipe.recipeId} title={recipe.title} to={`/receitas/${recipe.recipeId}`} imageUrl={recipe.imageUrl}>
                <span className="recipe-row-meta">
                  {[
                    recipe.dishType !== null ? dishTypeLabels[recipe.dishType] : null,
                    recipe.mainProtein !== null ? mainProteinLabels[recipe.mainProtein] : null,
                    recipeDifficultyLabels[recipe.difficulty],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {recipe.tags.length > 0 && (
                  <span className="recipe-row-tags">
                    {recipe.tags.slice(0, 4).join(", ")}
                    {recipe.tags.length > 4 && ` e mais ${recipe.tags.length - 4}`}
                  </span>
                )}
              </RecipeRow>
            ))}
          </ul>
        )
      )}

      {!error && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
      )}
    </div>
  );
}
