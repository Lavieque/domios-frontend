import { Busy } from "../components/Busy";
import type { IngredientDto } from "../api/client";
import { measurementUnitLabels, type ProductDto } from "../api/types";
import { tr } from "../i18n";
import { useCatalogSuggestions, type Suggestions } from "./useCatalogSuggestions";

export type CatalogPick =
  | { kind: "ingredient"; id: string; name: string; ingredient: IngredientDto }
  | { kind: "product"; id: string; name: string; product: ProductDto };

/** Lista de sugestões: ingredientes (qualquer marca) primeiro, depois produtos do catálogo. */
export function SuggestionList({ suggestions, onPick }: { suggestions: Suggestions; onPick: (pick: CatalogPick) => void }) {
  const { ingredients, products } = suggestions;
  if (ingredients.length === 0 && products.length === 0) return null;
  return (
    <ul className="product-results suggestion-list">
      {ingredients.length > 0 && <li className="result-group">{tr().ui.catalog.anyBrand}</li>}
      {ingredients.map((ingredient) => (
        <li key={ingredient.ingredientId}>
          <button
            type="button"
            onClick={() => onPick({ kind: "ingredient", id: ingredient.ingredientId, name: ingredient.displayName ?? ingredient.name, ingredient })}
          >
            <span className="result-text">
              <strong>{ingredient.displayName ?? ingredient.name}</strong>
              <span className="muted">{tr().ui.catalog.compareBrands}</span>
            </span>
          </button>
        </li>
      ))}
      {products.length > 0 && <li className="result-group">{tr().ui.catalog.specificProduct}</li>}
      {products.map((product) => (
        <li key={product.productId}>
          <button type="button" onClick={() => onPick({ kind: "product", id: product.productId, name: product.name, product })}>
            <span className="result-text">
              <strong>{product.name}</strong>
              <span className="muted">
                {product.brand ? `${product.brand} · ` : ""}
                {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Sugestões para uma linha já escrita; escolher uma devolve a ligação. */
export function LinkPicker({ label, onPick, onCancel }: { label: string; onPick: (pick: CatalogPick) => void; onCancel?: () => void }) {
  const suggestions = useCatalogSuggestions(label);
  const empty = !suggestions.loading && suggestions.ingredients.length === 0 && suggestions.products.length === 0;
  return (
    <div className="link-picker">
      {suggestions.loading && <p className="muted"><Busy>{tr().ui.picker.searching}</Busy></p>}
      {empty && <p className="muted">{tr().ui.catalog.nothingLike(label)}</p>}
      <SuggestionList suggestions={suggestions} onPick={onPick} />
      {onCancel && (
        <button type="button" className="link-button" onClick={onCancel}>
          {tr().common.close}
        </button>
      )}
    </div>
  );
}
