import type { CategoryDto } from "../api/types";

/**
 * O corredor de uma categoria de topo: a cor que a acompanha no catálogo, na
 * despensa e nas listas. As categorias vêm da Api com nomes livres, por isso
 * a cor sai do nome; o que não bate com nenhum corredor fica neutro, para a
 * cor nunca apontar o corredor errado.
 */
export type Aisle = "fresh" | "fish" | "pantry" | "bakery" | "dairy" | "home";

const rules: [Aisle, RegExp][] = [
  ["fish", /peix|marisc|bacalhau/],
  ["dairy", /latic|lactic|leite|iogurt|queij|ovos|manteig|natas/],
  ["bakery", /padar|pastel|p[ãa]o|bolo|cereai|bolach|doce/],
  ["fresh", /fresc|frut|legum|horti|talho|carne|charcut/],
  ["home", /limpez|higien|drogar|casa|beleza|beb[ée]|animai|lar\b/],
  ["pantry", /mercear|azeit|arroz|massa|conserv|despens|bebida|vinho|[áa]gua|caf[ée]|ch[áa]/],
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("pt-PT");
}

export function aisleOf(name: string | null | undefined): Aisle | null {
  if (!name) return null;
  const text = normalize(name);
  for (const [aisle, pattern] of rules) if (pattern.test(text)) return aisle;
  return null;
}

/** A categoria de topo de uma categoria, com o mapa das categorias por id. */
export function topCategory(category: CategoryDto, categories: Map<string, CategoryDto> | null): CategoryDto | null {
  let current: CategoryDto | undefined = category;
  for (let depth = 0; current && depth < 8; depth++) {
    if (!current.parentCategoryId) return current;
    if (!categories) return null;
    current = categories.get(current.parentCategoryId);
  }
  return null;
}

/** Classe CSS do corredor ("aisle-fish"), ou "aisle-none" sem categoria conhecida. */
export function aisleClass(aisle: Aisle | null): string {
  return aisle ? `aisle-${aisle}` : "aisle-none";
}
