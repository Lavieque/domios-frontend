import { useEffect, useState } from "react";
import { searchRecipes } from "../api/client";
import { dishTypeLabels, DishType, type RecipeSummaryDto } from "../api/types";
import { SearchField } from "./SearchField";

const PAGE_SIZE = 8;
const dishTypes = Object.values(DishType) as DishType[];

interface Props {
  /** Tipo de prato escolhido de início (o da receita a trocar); `null` = todos. */
  defaultDishType: DishType | null;
  onPick: (recipe: RecipeSummaryDto) => void;
  onCancel: () => void;
}

/** Procurar uma receita publicada por nome e tipo de prato, para a escolher. */
export function RecipePicker({ defaultDishType, onPick, onCancel }: Props) {
  const [search, setSearch] = useState("");
  const [dishType, setDishType] = useState<DishType | null>(defaultDishType);
  const [results, setResults] = useState<RecipeSummaryDto[] | null>(null);

  useEffect(() => {
    let active = true;
    setResults(null);
    const timer = setTimeout(() => {
      searchRecipes(search.trim(), 1, PAGE_SIZE, dishType === null ? {} : { dishType })
        .then((page) => active && setResults(page.items))
        .catch(() => active && setResults([]));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, dishType]);

  return (
    <div className="recipe-picker">
      <div className="filter-row">
        <SearchField value={search} label="Procurar receita" placeholder="Procurar receita…" onChange={setSearch} />
        <select
          className="category-select"
          aria-label="Tipo de prato"
          value={dishType === null ? "" : String(dishType)}
          onChange={(e) => setDishType(e.target.value === "" ? null : (Number(e.target.value) as DishType))}
        >
          <option value="">Todos os pratos</option>
          {dishTypes.map((type) => (
            <option key={type} value={type}>
              {dishTypeLabels[type]}
            </option>
          ))}
        </select>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      {results === null && <p className="muted loading">A procurar…</p>}
      {results !== null && results.length === 0 && <p className="muted">Nenhuma receita encontrada.</p>}
      {results !== null && results.length > 0 && (
        <ul className="recipe-picker-list">
          {results.map((recipe) => (
            <li key={recipe.recipeId}>
              <button type="button" className="recipe-picker-option" onClick={() => onPick(recipe)}>
                <span>{recipe.title}</span>
                {recipe.dishType !== null && <span className="muted">{dishTypeLabels[recipe.dishType]}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
