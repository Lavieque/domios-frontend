import { useEffect, useState } from "react";
import { searchIngredients, searchProducts, type IngredientDto } from "../api/client";
import type { ProductDto } from "../api/types";
import { searchTerms } from "./searchTerms";

export interface Suggestions {
  ingredients: IngredientDto[];
  products: ProductDto[];
  loading: boolean;
}

/**
 * Ingredientes e produtos que combinam com o texto. Tenta o texto inteiro, depois o singular, e fica com a
 * primeira que der alguma coisa.
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
