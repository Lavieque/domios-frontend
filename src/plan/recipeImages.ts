import { useEffect, useRef, useState } from "react";
import { getRecipe } from "../api/client";

/** Quantos pedidos de receita correm ao mesmo tempo. */
export const RECIPE_IMAGE_CONCURRENCY = 4;

/**
 * Chama `load` uma vez por id (sem repetidos), no máximo `limit` de cada vez, e
 * avisa `onResult` à medida que cada um chega. Um id que falha dá `null`.
 */
export async function loadEach(
  ids: readonly string[],
  load: (id: string) => Promise<string | null>,
  onResult: (id: string, value: string | null) => void,
  limit = RECIPE_IMAGE_CONCURRENCY,
): Promise<void> {
  const queue = [...new Set(ids)];
  async function worker() {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      let value: string | null = null;
      try {
        value = await load(id);
      } catch {
        value = null;
      }
      onResult(id, value);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, worker));
}

/**
 * As fotos das receitas destes ids, por id: `undefined` enquanto não se sabe,
 * `null` sem foto. Só pede as que ainda não conhece; `getRecipe` já vem da cache
 * em memória e da cache da Cloudflare.
 */
export function useRecipeImages(ids: readonly (string | null)[]): ReadonlyMap<string, string | null> {
  const [images, setImages] = useState<ReadonlyMap<string, string | null>>(() => new Map());
  // Os ids já pedidos: uma foto que chega não muda a chave nem cancela as outras.
  const requested = useRef(new Set<string>());
  const key = [...new Set(ids.filter((id): id is string => id !== null))].sort().join(",");

  useEffect(() => {
    const missing = key ? key.split(",").filter((id) => !requested.current.has(id)) : [];
    if (missing.length === 0) return;
    const pending = new Set(missing);
    for (const id of missing) requested.current.add(id);
    let cancelled = false;
    void loadEach(
      missing,
      (id) => getRecipe(id).then((recipe) => recipe.imageUrl),
      (id, url) => {
        if (cancelled) return;
        pending.delete(id);
        setImages((prev) => new Map(prev).set(id, url));
      },
    );
    return () => {
      cancelled = true;
      // O que ficou por chegar volta a poder ser pedido (o pedido em voo é partilhado pela cache).
      for (const id of pending) requested.current.delete(id);
    };
  }, [key]);

  return images;
}
