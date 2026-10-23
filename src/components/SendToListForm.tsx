import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { createShoppingList, type ShoppingListDto } from "../api/shopping";
import { describeError } from "../auth/errors";
import { useOpenLists } from "../shopping/useOpenLists";
import { ListPicker, NEW_LIST } from "./ListPicker";

interface Props {
  householdId: string;
  /** Nome da lista se for preciso criar uma. */
  newListName: string;
  submitLabel: string;
  /** Acrescenta à lista e diz quantos itens entraram. */
  send: (listId: string) => Promise<{ list: ShoppingListDto; added: number }>;
  children?: ReactNode;
}

/** Escolher uma lista aberta (ou criar uma) e acrescentar-lhe itens. */
export function SendToListForm({ householdId, newListName, submitLabel, send, children }: Props) {
  const { lists, reload } = useOpenLists(householdId);
  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<{ list: ShoppingListDto; added: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (lists === null) return <p className="muted loading">A carregar listas…</p>;
  const listId = chosen ?? lists[0]?.shoppingListId ?? NEW_LIST;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const targetId = listId === NEW_LIST ? (await createShoppingList(householdId, newListName)).shoppingListId : listId;
      setResult(await send(targetId));
      setChosen(targetId);
      reload();
    } catch (err) {
      setError(describeError(err, { "invalid-state-transition": "Essa lista já está fechada." }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <ListPicker lists={lists} value={listId} onChange={setChosen} />
      {children}
      <button type="submit" className="button-primary" disabled={submitting}>
        {submitting ? "A acrescentar…" : submitLabel}
      </button>
      {result && (
        <p className="notice inline-notice">
          {result.added === 0
            ? `Nada a acrescentar a ${result.list.name}.`
            : `${result.added} ${result.added === 1 ? "item acrescentado" : "itens acrescentados"} a ${result.list.name}.`}{" "}
          <Link to={`/listas/${result.list.shoppingListId}`}>Ver a lista</Link>
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
