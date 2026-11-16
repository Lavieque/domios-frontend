import type { ShoppingListSummaryDto } from "../api/shopping";
import { tr } from "../i18n";

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
    <select className="category-select" aria-label={tr().ui.sendToList.listLabel} value={value} onChange={(e) => onChange(e.target.value)}>
      {lists.map((list) => (
        <option key={list.shoppingListId} value={list.shoppingListId}>
          {tr().ui.sendToList.withPending(list.name, list.itemCount - list.purchasedItemCount)}
        </option>
      ))}
      <option value={NEW_LIST}>{tr().ui.sendToList.newList}</option>
    </select>
  );
}
