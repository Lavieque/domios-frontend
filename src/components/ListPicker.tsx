import type { ShoppingListSummaryDto } from "../api/shopping";

/** "" = criar uma lista nova. */
export const NEW_LIST = "";

export function ListPicker({
  lists,
  value,
  onChange,
}: {
  lists: ShoppingListSummaryDto[];
  value: string;
  onChange: (listId: string) => void;
}) {
  return (
    <select className="category-select" aria-label="Lista de compras" value={value} onChange={(e) => onChange(e.target.value)}>
      {lists.map((list) => (
        <option key={list.shoppingListId} value={list.shoppingListId}>
          {list.name} ({list.itemCount - list.purchasedItemCount} por comprar)
        </option>
      ))}
      <option value={NEW_LIST}>Nova lista</option>
    </select>
  );
}
