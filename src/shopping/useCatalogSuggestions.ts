import { useLoad } from "../useLoad";
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
  const terms = searchTerms(text);
  const active = enabled && terms.length > 0 && text.trim().length >= 2;
  // As sugestões anteriores ficam enquanto se escreve; uma falha deixa a lista vazia.
  const found = useLoad(
    active ? terms : null,
    async () => {
      for (const term of terms) {
        const [ingredients, products] = await Promise.all([searchIngredients(term, 4), searchProducts(term, 1, 5, undefined, true)]);
        if (ingredients.items.length > 0 || products.items.length > 0) return { ingredients: ingredients.items, products: products.items };
      }
      return { ingredients: [], products: [] };
    },
    { delay: 250, keepPrevious: true },
  );
  if (!active) return NONE;
  return { ingredients: found.data?.ingredients ?? [], products: found.data?.products ?? [], loading: found.loading };
}

const NONE: Suggestions = { ingredients: [], products: [], loading: false };
