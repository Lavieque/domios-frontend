import type { ShoppingListItemDto } from "../api/shopping";
import type { CategoryDto, ProductDto } from "../api/types";

export const OTHERS_GROUP = "Outros";

export interface ItemGroup {
  name: string;
  items: ShoppingListItemDto[];
}

/**
 * Itens agrupados pela categoria de topo do produto, por nome; os itens sem
 * produto (só ingrediente ou texto livre) e os de produto desconhecido ficam
 * em "Outros", no fim. Dentro de cada grupo mantém-se a ordem da lista.
 * Adenda 2026-10-29 de DomiOS_DataModel_Fase1.md, opção B.
 */
export function groupByTopCategory(
  items: ShoppingListItemDto[],
  products: Map<string, ProductDto>,
  categories: Map<string, CategoryDto>,
): ItemGroup[] {
  const groups = new Map<string, ShoppingListItemDto[]>();
  const others: ShoppingListItemDto[] = [];
  for (const item of items) {
    const name = topCategoryName(item, products, categories);
    if (!name) {
      others.push(item);
      continue;
    }
    const group = groups.get(name);
    if (group) group.push(item);
    else groups.set(name, [item]);
  }
  const named = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt-PT"))
    .map(([name, groupItems]) => ({ name, items: groupItems }));
  return others.length > 0 ? [...named, { name: OTHERS_GROUP, items: others }] : named;
}

function topCategoryName(
  item: ShoppingListItemDto,
  products: Map<string, ProductDto>,
  categories: Map<string, CategoryDto>,
): string | null {
  const category = item.productId ? products.get(item.productId)?.category : undefined;
  if (!category) return null;
  if (!category.parentCategoryId) return category.name;
  return categories.get(category.parentCategoryId)?.name ?? null;
}
