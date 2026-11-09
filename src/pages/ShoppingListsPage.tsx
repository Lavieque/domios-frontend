import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import {
  createShoppingList,
  listShoppingLists,
  ShoppingListStatus,
  shoppingListStatusLabels,
  type ShoppingListSummaryDto,
} from "../api/shopping";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";

const statuses = [ShoppingListStatus.Open, ShoppingListStatus.Completed, ShoppingListStatus.Cancelled];

export function ShoppingListsPage() {
  return <HouseholdGate>{(household) => <ShoppingLists household={household} />}</HouseholdGate>;
}

function ShoppingLists({ household }: { household: CallerHouseholdDto }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (Number(searchParams.get("estado") ?? ShoppingListStatus.Open) || 0) as ShoppingListStatus;

  const [lists, setLists] = useState<ShoppingListSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listShoppingLists(household.householdId, status)
      .then((result) => {
        if (cancelled) return;
        setLists(result.items);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(describeError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [household.householdId, status]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const list = await createShoppingList(household.householdId, name.trim() || null);
      navigate(`/listas/${list.shoppingListId}`);
    } catch (err) {
      setError(describeError(err));
      setCreating(false);
    }
  }

  return (
    <div className="page lists-page">
      <header className="page-head">
        <div>
          <h1>Listas de compras</h1>
          <p className="page-head-sub">{household.name}</p>
        </div>
      </header>

      <div className="lists-toolbar">
        <div className="chip-row" role="group" aria-label="Estado">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={status === s}
              onClick={() => setSearchParams(s === ShoppingListStatus.Open ? {} : { estado: String(s) }, { replace: true })}
            >
              {s === ShoppingListStatus.Open ? "Abertas" : s === ShoppingListStatus.Completed ? "Concluídas" : "Canceladas"}
            </button>
          ))}
        </div>
        <form className="inline-form new-list-form" onSubmit={handleCreate}>
          <input type="text" aria-label="Nome da lista" placeholder="Nome da nova lista (opcional)" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="button-primary" disabled={creating}>
            {creating ? "A criar…" : "Nova lista"}
          </button>
        </form>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && lists.length === 0 ? (
        <p className="empty-state">Sem listas {shoppingListStatusLabels[status].toLowerCase().replace(/a$/, "as")}.</p>
      ) : (
        !loading && (
          <ul className="pantry-list">
            {lists.map((list) => (
              <li key={list.shoppingListId} className="lists-row">
                <Link to={`/listas/${list.shoppingListId}`} className="lists-row-link">
                  <span className="list-tally-count" aria-hidden="true">
                    {list.itemCount - list.purchasedItemCount}
                  </span>
                  <span className="lists-row-text">
                    <span className="lists-row-name">{list.name}</span>
                    <span className="lists-row-meta">
                      {list.itemCount === 0
                        ? "Vazia"
                        : `${list.itemCount - list.purchasedItemCount} por comprar · ${list.purchasedItemCount} de ${list.itemCount} comprados`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
