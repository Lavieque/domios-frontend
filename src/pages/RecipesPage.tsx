import { Busy } from "../components/Busy";
import { useEffect, useState } from "react";
import { useLoad } from "../useLoad";
import { useSearchParams } from "react-router-dom";
import { CardsSkeleton } from "../components/CardsSkeleton";
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
import { FeatureCard } from "../components/FeatureCard";
import { RecipeRow } from "../components/RecipeRow";
import { usePageSize } from "../usePageSize";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";
import { listAllCookedRecipes } from "../api/savedRecipes";
import { useHouseholds } from "../household/useHouseholds";
import { localDay, longDate } from "../plan/dates";

const count = numberFormat();
const dishTypes = Object.values(DishType) as DishType[];
const proteins = Object.values(MainProtein) as MainProtein[];
const difficulties = Object.values(RecipeDifficulty) as RecipeDifficulty[];

function parseEnum<T extends number>(value: string | null, allowed: T[]): T | undefined {
  if (value === null) return undefined;
  const n = Number(value) as T;
  return allowed.includes(n) ? n : undefined;
}

interface Cooked {
  times: number;
  last: string;
}

/**
 * As receitas que a casa escolhida já fez, por id. Só informativo: sem casa ou
 * com erro fica vazio e a lista mostra-se igual.
 */
function useCookedRecipes(): Map<string, Cooked> {
  const householdId = useHouseholds().current?.householdId ?? null;
  const [cooked, setCooked] = useState<{ householdId: string; map: Map<string, Cooked> } | null>(null);

  useEffect(() => {
    if (!householdId) return;
    let active = true;
    listAllCookedRecipes(householdId)
      .then((items) => {
        if (!active) return;
        const map = new Map(items.map((item) => [item.recipeId, { times: item.timesCooked, last: item.lastCookedAt }]));
        setCooked({ householdId, map });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [householdId]);

  // Só as marcas da casa atual: ao mudar de casa (ou sem casa), as da anterior somem logo.
  return cooked && cooked.householdId === householdId ? cooked.map : EMPTY;
}

const EMPTY = new Map<string, Cooked>();

/**
 * Marca no canto do cartão. O texto aparece ao passar o rato, com o foco do teclado
 * ou ao tocar (no telemóvel não há rato); tocar outra vez ou sair fecha-o.
 */
function CookedMark({ cooked }: { cooked: Cooked }) {
  const [open, setOpen] = useState(false);
  const text = tr().recipes.cookedMark(cooked.times, longDate(localDay(cooked.last)));
  return (
    <button
      type="button"
      className="cooked-mark"
      aria-label={text}
      data-tip={text}
      data-open={open || undefined}
      onClick={(event) => {
        // Por cima da ligação do cartão: tocar na marca não abre a receita.
        event.preventDefault();
        event.stopPropagation();
        setOpen((value) => !value);
      }}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 8.5l2.6 2.5L12 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function RecipesPage() {
  // 25 = a receita em destaque + 24 na grelha, que enche filas de 2, 3 e 4 cartões.
  const pageSize = usePageSize(25, 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const dishType = parseEnum(searchParams.get("prato"), dishTypes);
  const mainProtein = parseEnum(searchParams.get("proteina"), proteins);
  const difficulty = parseEnum(searchParams.get("dificuldade"), difficulties);

  const cooked = useCookedRecipes();
  // O total anterior fica enquanto a página nova carrega: a contagem e a paginação não piscam.
  const found = useLoad(
    [search, page, pageSize, dishType, mainProtein, difficulty],
    () => searchRecipes(search, page, pageSize, { dishType, mainProtein, difficulty }),
    { keepPrevious: true },
  );
  const recipes: RecipeSummaryDto[] = found.data?.items ?? [];
  const total = found.data?.total ?? 0;
  const { loading, error } = found;
  const filtered = search !== "" || dishType !== undefined || mainProtein !== undefined || difficulty !== undefined;
  // A primeira receita vai em destaque; a lista a seguir não a repete.
  const featured = !filtered && page === 1 && !loading && recipes.length > 0;

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

  // O total só se diz quando a Api o deu; com filtros é o que eles encontram, não o catálogo.
  const countLine = loading
    ? <Busy>{tr().lists2.searching}</Busy>
    : error
      ? tr().recipes.forCooking
      : filtered
        ? tr().recipes.withFilters(count.format(total), total)
        : tr().recipes.published(count.format(total));

  return (
    <div className="page recipes-page">
      <header className="page-head">
        <div>
          <h1>{tr().recipes.title}</h1>
          <p className="page-head-sub" aria-live="polite">
            {countLine}
          </p>
        </div>
      </header>

      {featured && (
        <FeatureCard
          eyebrow={tr().recipes.ourPick}
          title={recipes[0].title}
          meta={[
            recipes[0].dishType !== null ? dishTypeLabels[recipes[0].dishType] : null,
            recipeDifficultyLabels[recipes[0].difficulty],
          ]
            .filter(Boolean)
            .join(" · ")}
          imageUrl={recipes[0].imageUrl}
          to={`/receitas/${recipes[0].recipeId}`}
          badge={cooked.has(recipes[0].recipeId) ? <CookedMark cooked={cooked.get(recipes[0].recipeId)!} /> : undefined}
        />
      )}

      <div className="section-head section-head-loose">
        <h2>{tr().recipes.explore}</h2>
      </div>

      <div className="toolbar">
        <SearchField
          label={tr().recipes.search}
          placeholder={tr().recipes.searchPlaceholder}
          value={search}
          onChange={(value) => applyFilters({ search: value, page: 1 })}
        />
        <select
          className="category-select"
          aria-label={tr().ui.picker.dishType}
          value={dishType ?? ""}
          onChange={(e) => applyFilters({ dishType: e.target.value === "" ? null : (Number(e.target.value) as DishType), page: 1 })}
        >
          <option value="">{tr().ui.picker.allDishes}</option>
          {dishTypes.map((type) => (
            <option key={type} value={type}>
              {dishTypeLabels[type]}
            </option>
          ))}
        </select>
        <select
          className="category-select"
          aria-label={tr().recipes.difficulty}
          value={difficulty ?? ""}
          onChange={(e) =>
            applyFilters({ difficulty: e.target.value === "" ? null : (Number(e.target.value) as RecipeDifficulty), page: 1 })
          }
        >
          <option value="">{tr().recipes.anyDifficulty}</option>
          {difficulties.map((level) => (
            <option key={level} value={level}>
              {recipeDifficultyLabels[level]}
            </option>
          ))}
        </select>
      </div>

      <div className="chip-row" role="group" aria-label={tr().recipes.mainProtein}>
        <button type="button" className="chip" aria-pressed={mainProtein === undefined} onClick={() => applyFilters({ mainProtein: null, page: 1 })}>
          {tr().lists2.all}
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

      {!error && loading && <CardsSkeleton />}
      {error ? null : !loading && recipes.length === 0 ? (
        <p className="empty-state">{tr().recipes.none}</p>
      ) : (
        !loading && (
          <ul className="recipe-rows">
            {(featured ? recipes.slice(1) : recipes).map((recipe) => (
              <RecipeRow
                key={recipe.recipeId}
                title={recipe.title}
                to={`/receitas/${recipe.recipeId}`}
                imageUrl={recipe.imageUrl}
                badge={cooked.has(recipe.recipeId) ? <CookedMark cooked={cooked.get(recipe.recipeId)!} /> : undefined}
              >
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
                    {recipe.tags.length > 4 && tr().lists2.andMore(recipe.tags.length - 4)}
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
