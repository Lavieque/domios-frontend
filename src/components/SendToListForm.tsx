import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { createShoppingList, type ShoppingListDto } from "../api/shopping";
import { describeError } from "../auth/errors";
import { useOpenLists } from "../shopping/useOpenLists";
import { ListPicker, NEW_LIST } from "./ListPicker";
import { tr } from "../i18n";

interface SendResult {
  list: ShoppingListDto;
  added: number;
  /** Linhas que a lista já tinha a cobrir (só o plano o sabe dizer). */
  covered?: number;
}

interface Props {
  householdId: string;
  /** Nome da lista se for preciso criar uma. */
  newListName: string;
  submitLabel: string;
  /** Acrescenta à lista e diz quantos itens entraram. */
  send: (listId: string) => Promise<SendResult>;
  children?: ReactNode;
}

/** Escolher uma lista aberta (ou criar uma) e acrescentar-lhe itens. */
export function SendToListForm({ householdId, newListName, submitLabel, send, children }: Props) {
  const { lists, reload } = useOpenLists(householdId);
  const [chosen, setChosen] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (lists === null) return <p className="muted loading">{tr().ui.sendToList.loadingLists}</p>;
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
      setError(describeError(err, { "invalid-state-transition": tr().ui.sendToList.listClosed }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <ListPicker lists={lists} value={listId} onChange={setChosen} />
      {children}
      <button type="submit" className="button-primary" disabled={submitting}>
        {submitting ? tr().ui.sendToList.adding : submitLabel}
      </button>
      {result && (
        <p className="notice inline-notice">
          {result.added === 0
            ? result.covered
              ? tr().ui.sendToList.alreadyHas(result.list.name)
              : tr().ui.sendToList.nothingToAdd(result.list.name)
            : tr().ui.sendToList.added(result.added, result.list.name)}{" "}
          <Link to={`/listas/${result.list.shoppingListId}`}>{tr().ui.sendToList.seeList}</Link>
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
