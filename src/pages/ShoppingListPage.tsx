import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import {
  addShoppingListItem,
  cancelShoppingList,
  completeShoppingList,
  deleteShoppingListItem,
  getShoppingList,
  getStoreComparison,
  renameShoppingList,
  reopenShoppingList,
  setItemPurchased,
  ShoppingListStatus,
  shoppingListStatusLabels,
  UnpricedItemReason,
  type ShoppingListDto,
  type ShoppingListItemDto,
  type StoreComparisonDto,
} from "../api/shopping";
import { MeasurementUnit, measurementUnitLabels } from "../api/types";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const units = Object.values(MeasurementUnit) as MeasurementUnit[];

export function ShoppingListPage() {
  const { id } = useParams();
  if (!id) return null;
  return <HouseholdGate>{(household) => <ShoppingList household={household} listId={id} />}</HouseholdGate>;
}

function ShoppingList({ household, listId }: { household: CallerHouseholdDto; listId: string }) {
  const householdId = household.householdId;
  const [list, setList] = useState<ShoppingListDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [comparison, setComparison] = useState<StoreComparisonDto | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getShoppingList(householdId, listId)
      .then((result) => !cancelled && setList(result))
      .catch((err: unknown) => !cancelled && setError(describeError(err, { "not-found": "Esta lista não existe nesta casa." })));
    return () => {
      cancelled = true;
    };
  }, [householdId, listId, version]);

  async function act(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      setComparison(null); // os totais mudam com os itens
      setVersion((v) => v + 1);
    } catch (err) {
      setError(describeError(err, { "invalid-state-transition": "A lista está fechada: reabre-a para a alterar." }));
    }
  }

  async function compare() {
    setComparing(true);
    try {
      setComparison(await getStoreComparison(householdId, listId));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setComparing(false);
    }
  }

  if (!list) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted loading">A carregar…</p>
    );
  }

  const open = list.status === ShoppingListStatus.Open;
  const pending = list.items.filter((item) => !item.isPurchased);
  const purchased = list.items.filter((item) => item.isPurchased);

  return (
    <div className="page">
      <Link to="/listas" className="back-link">
        ← Listas de compras
      </Link>
      <p className="eyebrow">
        {household.name} · {shoppingListStatusLabels[list.status]}
      </p>
      <ListName list={list} onRename={(name) => act(() => renameShoppingList(householdId, listId, name))} />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {open && <AddItemForm onAdd={(label, amount, unit) => act(() => addShoppingListItem(householdId, listId, { label, quantity: { amount, unit } }))} />}

      {list.items.length === 0 ? (
        <p className="empty-state">
          Lista vazia. Acrescenta itens aqui, a partir de uma receita, ou com o que falta no <Link to="/plano">plano da semana</Link>.
        </p>
      ) : (
        <>
          <h2>Por comprar ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="muted">Tudo comprado.</p>
          ) : (
            <ItemList items={pending} open={open} onToggle={(item) => act(() => setItemPurchased(householdId, listId, item.shoppingListItemId, true))} onDelete={(item) => act(() => deleteShoppingListItem(householdId, listId, item.shoppingListItemId))} />
          )}
          {purchased.length > 0 && (
            <>
              <h2>Comprados ({purchased.length})</h2>
              <ItemList items={purchased} open={open} onToggle={(item) => act(() => setItemPurchased(householdId, listId, item.shoppingListItemId, false))} onDelete={(item) => act(() => deleteShoppingListItem(householdId, listId, item.shoppingListItemId))} />
            </>
          )}
        </>
      )}

      <div className="button-row list-status-actions">
        {open ? (
          <>
            <button type="button" className="button-primary" onClick={() => act(() => completeShoppingList(householdId, listId))}>
              Concluir lista
            </button>
            <button type="button" className="button-secondary" onClick={() => act(() => cancelShoppingList(householdId, listId))}>
              Cancelar lista
            </button>
          </>
        ) : (
          <button type="button" className="button-secondary" onClick={() => act(() => reopenShoppingList(householdId, listId))}>
            Reabrir lista
          </button>
        )}
      </div>

      {pending.length > 0 && (
        <section className="panel comparison-panel">
          <h2>Onde fica mais barato</h2>
          {!comparison ? (
            <button type="button" className="button-secondary" onClick={compare} disabled={comparing}>
              {comparing ? "A comparar…" : "Comparar lojas"}
            </button>
          ) : (
            <Comparison comparison={comparison} items={list.items} />
          )}
        </section>
      )}
    </div>
  );
}

function ListName({ list, onRename }: { list: ShoppingListDto; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);

  if (!editing) {
    return (
      <h1 className="list-title">
        {list.name}
        {list.status === ShoppingListStatus.Open && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setName(list.name);
              setEditing(true);
            }}
          >
            Mudar nome
          </button>
        )}
      </h1>
    );
  }

  return (
    <form
      className="inline-form list-title"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onRename(name.trim());
        setEditing(false);
      }}
    >
      <input type="text" aria-label="Nome da lista" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" className="button-primary">
        Guardar
      </button>
      <button type="button" className="link-button" onClick={() => setEditing(false)}>
        Cancelar
      </button>
    </form>
  );
}

function AddItemForm({ onAdd }: { onAdd: (label: string, amount: number, unit: MeasurementUnit) => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState<MeasurementUnit>(MeasurementUnit.Unit);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!label.trim() || !(value > 0)) return;
    onAdd(label.trim(), value, unit);
    setLabel("");
    setAmount("1");
  }

  return (
    <form className="inline-form add-item-form" onSubmit={handleSubmit}>
      <input type="text" aria-label="Item" placeholder="Acrescentar item…" required maxLength={200} value={label} onChange={(e) => setLabel(e.target.value)} />
      <input type="text" inputMode="decimal" aria-label="Quantidade" className="amount-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select className="category-select" aria-label="Unidade" value={unit} onChange={(e) => setUnit(Number(e.target.value) as MeasurementUnit)}>
        {units.map((u) => (
          <option key={u} value={u}>
            {measurementUnitLabels[u]}
          </option>
        ))}
      </select>
      <button type="submit" className="button-primary">
        Acrescentar
      </button>
    </form>
  );
}

function ItemList({
  items,
  open,
  onToggle,
  onDelete,
}: {
  items: ShoppingListItemDto[];
  open: boolean;
  onToggle: (item: ShoppingListItemDto) => void;
  onDelete: (item: ShoppingListItemDto) => void;
}) {
  return (
    <ul className="pantry-list">
      {items.map((item) => (
        <li key={item.shoppingListItemId} className={`list-row${item.isPurchased ? " is-purchased" : ""}`}>
          <label className="item-check">
            <input type="checkbox" checked={item.isPurchased} disabled={!open} onChange={() => onToggle(item)} />
            <span className="meal-title">{item.label}</span>
          </label>
          <span className="muted">
            {quantityFormat.format(item.quantity.amount)} {measurementUnitLabels[item.quantity.unit]}
          </span>
          {open && (
            <button type="button" className="link-button" onClick={() => onDelete(item)}>
              Remover
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Comparison({ comparison, items }: { comparison: StoreComparisonDto; items: ShoppingListItemDto[] }) {
  const labelOf = (itemId: string) => items.find((i) => i.shoppingListItemId === itemId)?.label ?? "?";
  const { split } = comparison;
  const storeName = (storeId: string) => comparison.stores.find((s) => s.storeId === storeId)?.chainName ?? "?";
  const best = comparison.stores[0];

  // A Api devolve todas as lojas abertas, mesmo sem nenhum item; só interessam as que têm algum.
  const stores = comparison.stores.filter((s) => s.coveredItemCount > 0);
  const anyPrice = stores.length > 0;

  return (
    <div>
      {!anyPrice && <p className="muted">Nenhuma loja tem preço recente para estes itens.</p>}
      {anyPrice && (
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Itens com preço</th>
            <th className="num">Total</th>
            <th className="num">Com cartão</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.storeId} className={store.storeId === best?.storeId ? "offer-lowest" : ""}>
              <td>{store.chainName}</td>
              <td>
                {store.coveredItemCount} de {comparison.itemCount}
              </td>
              <td className="num">{money.format(store.total)}</td>
              <td className="num">{money.format(store.cardTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      {split.storeCount > 1 && split.savingVsBestStore > 0 && (
        <p className="notice">
          Dividindo a compra por {split.storeCount} lojas: {money.format(split.total)} ({money.format(split.cardTotal)} com cartão),
          menos {money.format(split.savingVsBestStore)} do que tudo no {best?.chainName}.
          <br />
          <span className="muted">
            {split.items.map((line) => `${labelOf(line.itemId)} → ${storeName(line.storeId)}`).join(" · ")}
          </span>
        </p>
      )}

      {comparison.unpricedItems.length > 0 && (
        <p className="muted">
          Sem preço:{" "}
          {comparison.unpricedItems
            .map((item) => `${item.label} (${item.reason === UnpricedItemReason.NoProduct ? "sem produto ligado" : "nenhuma loja vende"})`)
            .join(", ")}
          . Itens escritos à mão só têm preço quando ligados a um produto ou ingrediente.
        </p>
      )}
      <p className="muted comparison-note">Preços dos últimos 3 dias nas lojas online; as embalagens são arredondadas para cima.</p>
    </div>
  );
}
