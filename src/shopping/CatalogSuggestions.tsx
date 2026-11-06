import { useEffect, useState } from "react";
import { searchIngredients, searchProducts, type IngredientDto } from "../api/client";
import { measurementUnitLabels, type ProductDto } from "../api/types";

export type CatalogPick =
  | { kind: "ingredient"; id: string; name: string; ingredient: IngredientDto }
  | { kind: "product"; id: string; name: string; product: ProductDto };

interface Suggestions {
  ingredients: IngredientDto[];
  products: ProductDto[];
  loading: boolean;
}

/** "Pimentos" → "Pimento": o catálogo está no singular, a lista escreve-se no plural. */
export function searchTerms(label: string): string[] {
  const text = label.trim();
  const words = text.split(/\s+/);
  const singular = words.map((w) => (w.length > 3 ? w.replace(/([^s])s$/i, "$1") : w)).join(" ");
  return [...new Set([text, singular, words[0]])].filter((t) => t.length >= 2);
}

/**
 * Ingredientes e produtos que combinam com o texto. Tenta o texto inteiro, depois o singular, depois a primeira
 * palavra, e fica com a primeira que der alguma coisa.
 */
export function useCatalogSuggestions(text: string, enabled = true): Suggestions {
  const [state, setState] = useState<Suggestions>({ ingredients: [], products: [], loading: false });

  useEffect(() => {
    const terms = searchTerms(text);
    if (!enabled || terms.length === 0 || text.trim().length < 2) {
      setState({ ingredients: [], products: [], loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    const timer = setTimeout(async () => {
      try {
        for (const term of terms) {
          const [ingredients, products] = await Promise.all([searchIngredients(term, 4), searchProducts(term, 1, 5, undefined, true)]);
          if (cancelled) return;
          if (ingredients.items.length > 0 || products.items.length > 0) {
            setState({ ingredients: ingredients.items, products: products.items, loading: false });
            return;
          }
        }
        if (!cancelled) setState({ ingredients: [], products: [], loading: false });
      } catch {
        if (!cancelled) setState({ ingredients: [], products: [], loading: false });
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, enabled]);

  return state;
}

/** Lista de sugestões: ingredientes (qualquer marca) primeiro, depois produtos do catálogo. */
export function SuggestionList({ suggestions, onPick }: { suggestions: Suggestions; onPick: (pick: CatalogPick) => void }) {
  const { ingredients, products } = suggestions;
  if (ingredients.length === 0 && products.length === 0) return null;
  return (
    <ul className="product-results suggestion-list">
      {ingredients.length > 0 && <li className="result-group">Qualquer marca</li>}
      {ingredients.map((ingredient) => (
        <li key={ingredient.ingredientId}>
          <button
            type="button"
            onClick={() => onPick({ kind: "ingredient", id: ingredient.ingredientId, name: ingredient.displayName ?? ingredient.name, ingredient })}
          >
            <span className="result-text">
              <strong>{ingredient.displayName ?? ingredient.name}</strong>
              <span className="muted">Compara todas as marcas</span>
            </span>
          </button>
        </li>
      ))}
      {products.length > 0 && <li className="result-group">Produto em concreto</li>}
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
      {suggestions.loading && <p className="muted">A procurar…</p>}
      {empty && <p className="muted">Nada no catálogo parecido com “{label}”.</p>}
      <SuggestionList suggestions={suggestions} onPick={onPick} />
      {onCancel && (
        <button type="button" className="link-button" onClick={onCancel}>
          Fechar
        </button>
      )}
    </div>
  );
}
