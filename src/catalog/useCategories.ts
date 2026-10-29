import { useEffect, useState } from "react";
import { getCategories } from "../api/client";
import type { CategoryDto } from "../api/types";

// As categorias com produtos lêem-se uma vez por sessão de página, como os
// produtos em useProducts; um erro deixa a próxima chamada tentar outra vez.
let pending: Promise<CategoryDto[] | null> | null = null;

function load(): Promise<CategoryDto[] | null> {
  pending ??= getCategories(true).catch(() => {
    pending = null;
    return null;
  });
  return pending;
}

/** Categorias com produtos por id; `null` enquanto não chegam ou se falharem. */
export function useCategories(): Map<string, CategoryDto> | null {
  const [categories, setCategories] = useState<Map<string, CategoryDto> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then((loaded) => {
      if (!cancelled && loaded) setCategories(new Map(loaded.map((c) => [c.categoryId, c])));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}
