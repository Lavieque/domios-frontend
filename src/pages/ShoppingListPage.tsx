import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import {
  addShoppingListItem,
  cancelShoppingList,
  completeShoppingList,
  deleteShoppingListItem,
  getShoppingList,
  getShoppingListPackaging,
  getStoreComparison,
  linkShoppingListItem,
  renameShoppingList,
  reopenShoppingList,
  reorderShoppingListItems,
  setItemPurchased,
  ShoppingListStatus,
  storeShoppingListInPantry,
  shoppingListStatusLabels,
  UnpricedItemReason,
  type ShoppingListDto,
  type ShoppingItemPackagingDto,
  type ShoppingListItemDto,
  type StoreComparisonDto,
  type StoreComparisonStoreDto,
  type StoreInPantryResultDto,
} from "../api/shopping";
import { PantryLocation, pantryLocationLabels, pantryLocations } from "../api/pantry";
import { MeasurementUnit, measurementUnitLabels } from "../api/types";
import { describeError } from "../auth/errors";
import { aisleClass, aisleOf } from "../catalog/aisles";
import { useCategories } from "../catalog/useCategories";
import { LabelPrice, ShelfLabel, VerdictBand } from "../components/ShelfLabel";
import { HouseholdGate } from "../household/HouseholdGate";
import { useProducts } from "../pantry/useProducts";
import { groupByTopCategory, OTHERS_GROUP, type ItemGroup } from "../shopping/groups";
import { moveItem, withPendingOrder } from "../shopping/order";
import { LinkPicker, SuggestionList, useCatalogSuggestions, type CatalogPick } from "../shopping/CatalogSuggestions";

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
  // Aviso antes de comparar: linhas escritas à mão que ainda não estão ligadas a um produto.
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [packaging, setPackaging] = useState<Map<string, ShoppingItemPackagingDto>>(new Map());
  // Modo "Ordenar": ids dos itens por comprar pela ordem que se está a montar; null fora do modo.
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const products = useProducts(list?.items.flatMap((item) => (item.productId && !item.isPurchased ? [item.productId] : [])) ?? []);
  const categories = useCategories();

  useEffect(() => {
    let cancelled = false;
    getShoppingList(householdId, listId)
      .then((result) => !cancelled && setList(result))
      .catch((err: unknown) => !cancelled && setError(describeError(err, { "not-found": "Esta lista não existe nesta casa." })));
    return () => {
      cancelled = true;
    };
  }, [householdId, listId, version]);

  // As embalagens são um extra: se falharem, a lista mostra-se na mesma.
  useEffect(() => {
    let cancelled = false;
    getShoppingListPackaging(householdId, listId)
      .then((result) => !cancelled && setPackaging(new Map(result.items.map((p) => [p.shoppingListItemId, p]))))
      .catch(() => !cancelled && setPackaging(new Map()));
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

  const unlinked = list?.items.filter((item) => !item.isPurchased && !item.productId && !item.ingredientId) ?? [];

  /** Liga uma linha ao catálogo; se era a última por ligar, compara logo. */
  async function link(item: ShoppingListItemDto, pick: CatalogPick) {
    setError(null);
    try {
      const updated = await linkShoppingListItem(householdId, listId, item.shoppingListItemId, pick.kind === "product" ? { productId: pick.id } : { ingredientId: pick.id });
      setList(updated);
      setComparison(null);
      setVersion((v) => v + 1);
      const stillUnlinked = updated.items.some((i) => !i.isPurchased && !i.productId && !i.ingredientId);
      if (checkingLinks && !stillUnlinked) {
        setCheckingLinks(false);
        await compare();
      }
    } catch (err) {
      setError(describeError(err));
    }
  }

  /** Com linhas por ligar, avisa primeiro; "Comparar mesmo assim" salta o aviso. */
  async function startCompare() {
    if (unlinked.length > 0) {
      setCheckingLinks(true);
      return;
    }
    await compare();
  }

  async function compare() {
    setCheckingLinks(false);
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
  // Depois de comparar: onde cada item fica mais barato, pela divisão da Api.
  const cheapestByItem = new Map<string, { chainName: string; lineTotal: number }>();
  for (const line of comparison?.split.items ?? []) {
    const store = comparison?.stores.find((st) => st.storeId === line.storeId);
    if (!store) continue;
    for (const itemId of line.itemIds) cheapestByItem.set(itemId, { chainName: store.chainName, lineTotal: line.lineTotal });
  }
  const pending = list.items.filter((item) => !item.isPurchased);
  const purchased = list.items.filter((item) => item.isPurchased);
  const notInPantry = purchased.filter((item) => !item.storedInPantryAt);

  return (
    <div className="page">
      <Link to="/listas" className="back-link">
        Listas de compras
      </Link>
      <ListName list={list} onRename={(name) => act(() => renameShoppingList(householdId, listId, name))} />
      <p className="page-sub">
        <span className={`status-tag status-${list.status}`}>{shoppingListStatusLabels[list.status]}</span>
        {household.name} · {pending.length} por comprar de {list.items.length}
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {open && (
        <AddItemForm
          onAdd={(label, amount, unit, pick) =>
            act(() =>
              addShoppingListItem(householdId, listId, {
                label,
                quantity: { amount, unit },
                productId: pick?.kind === "product" ? pick.id : null,
                ingredientId: pick?.kind === "ingredient" ? pick.id : null,
              }),
            )
          }
        />
      )}

      {pending.length > 0 && (
        <section className="panel comparison-panel">
          <h2>Onde fica mais barato</h2>
          {checkingLinks && unlinked.length > 0 && (
            <UnlinkedWarning items={unlinked} onLink={link} onCompareAnyway={compare} onCancel={() => setCheckingLinks(false)} />
          )}
          {!comparison ? (
            !checkingLinks && (
              <button type="button" className="button-secondary" onClick={startCompare} disabled={comparing}>
                {comparing ? "A comparar…" : "Comparar lojas"}
              </button>
            )
          ) : (
            <Comparison comparison={comparison} items={list.items} />
          )}
        </section>
      )}

      {list.items.length === 0 ? (
        <p className="empty-state">
          Lista vazia. Acrescenta itens aqui, a partir de uma receita, ou com o que falta no <Link to="/plano">plano da semana</Link>.
        </p>
      ) : (
        <>
          <div className="section-head pending-head">
            <h2>Por comprar ({pending.length})</h2>
            {open && pending.length > 1 && !draftOrder && (
              <button type="button" className="link-button" onClick={() => setDraftOrder(pending.map((item) => item.shoppingListItemId))}>
                Ordenar
              </button>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="muted">Tudo comprado.</p>
          ) : draftOrder ? (
            <OrderItems
              items={draftOrder.flatMap((itemId) => pending.filter((item) => item.shoppingListItemId === itemId))}
              onMove={(index, delta) => setDraftOrder(moveItem(draftOrder, index, delta))}
              onDone={() => {
                const order = withPendingOrder(list.items, draftOrder);
                setDraftOrder(null);
                void act(() => reorderShoppingListItems(householdId, listId, order));
              }}
              onCancel={() => setDraftOrder(null)}
            />
          ) : (
            <PendingItems
              items={pending}
              groups={categories && (products.size > 0 || !pending.some((item) => item.productId)) ? groupByTopCategory(pending, products, categories) : null}
              open={open}
              cheapest={cheapestByItem}
              packaging={packaging}
              onToggle={(item) => act(() => setItemPurchased(householdId, listId, item.shoppingListItemId, true))}
              onDelete={(item) => act(() => deleteShoppingListItem(householdId, listId, item.shoppingListItemId))}
              onLink={link}
            />
          )}
          {purchased.length > 0 && (
            <>
              <h2>Comprados ({purchased.length})</h2>
              <ItemList items={purchased} open={open} packaging={packaging} onToggle={(item) => act(() => setItemPurchased(householdId, listId, item.shoppingListItemId, false))} onDelete={(item) => act(() => deleteShoppingListItem(householdId, listId, item.shoppingListItemId))} />
            </>
          )}
        </>
      )}

      {list.status !== ShoppingListStatus.Cancelled && notInPantry.length > 0 && (
        <StoreInPantryPanel
          count={notInPantry.length}
          onStore={async (location) => {
            const result = await storeShoppingListInPantry(householdId, listId, location);
            setVersion((v) => v + 1);
            return result;
          }}
        />
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

    </div>
  );
}

/** O que está comprado e ainda fora da despensa: um clique e entra, com o sítio escolhido. */
function StoreInPantryPanel({ count, onStore }: { count: number; onStore: (location: PantryLocation) => Promise<StoreInPantryResultDto> }) {
  const [location, setLocation] = useState<PantryLocation>(PantryLocation.Pantry);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StoreInPantryResultDto | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setResult(await onStore(location));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel store-in-pantry">
      <h2>Pôr na despensa</h2>
      <p className="muted">
        {count === 1 ? "1 item comprado ainda não está" : `${count} itens comprados ainda não estão`} na despensa. Entram com a quantidade da lista; a
        validade podes acertar depois, na despensa.
      </p>
      <form className="inline-form" onSubmit={handleSubmit}>
        <select className="category-select" aria-label="Onde ficam" value={location} onChange={(e) => setLocation(Number(e.target.value) as PantryLocation)}>
          {pantryLocations.map((loc) => (
            <option key={loc} value={loc}>
              {pantryLocationLabels[loc]}
            </option>
          ))}
        </select>
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? "A guardar…" : "Pôr na despensa"}
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className="notice inline-notice">
          {result.storedCount === 1 ? "1 item entrou" : `${result.storedCount} itens entraram`} na <Link to="/despensa">despensa</Link>.
          {result.skipped.length > 0 &&
            ` Ficaram de fora, por não terem produto nem ingrediente: ${result.skipped.map((s) => s.label).join(", ")}. Acrescenta-os à mão na despensa.`}
        </p>
      )}
    </section>
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

/** Linhas por ligar, antes de comparar: cada uma com as sugestões do catálogo; ligar a última compara. */
function UnlinkedWarning({
  items,
  onLink,
  onCompareAnyway,
  onCancel,
}: {
  items: ShoppingListItemDto[];
  onLink: (item: ShoppingListItemDto, pick: CatalogPick) => void;
  onCompareAnyway: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="notice unlinked-warning" role="status">
      <p>
        {items.length === 1 ? "1 item não está ligado" : `${items.length} itens não estão ligados`} a um produto do catálogo e por isso não entra
        {items.length === 1 ? "" : "m"} na comparação. Confirma o que é cada um:
      </p>
      <ul className="unlinked-list">
        {items.map((item) => (
          <li key={item.shoppingListItemId}>
            <strong>{item.label}</strong>
            <LinkPicker label={item.label} onPick={(pick) => onLink(item, pick)} />
          </li>
        ))}
      </ul>
      <div className="button-row">
        <button type="button" className="button-secondary" onClick={onCompareAnyway}>
          Comparar mesmo assim
        </button>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AddItemForm({ onAdd }: { onAdd: (label: string, amount: number, unit: MeasurementUnit, pick: CatalogPick | null) => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState<MeasurementUnit>(MeasurementUnit.Unit);
  // A escolha feita nas sugestões; escrever outra vez desfaz-a.
  const [pick, setPick] = useState<CatalogPick | null>(null);
  const suggestions = useCatalogSuggestions(label, pick === null);

  function handlePick(chosen: CatalogPick) {
    setPick(chosen);
    setLabel(chosen.name);
    if (chosen.kind === "product") setUnit(chosen.product.packageUnit);
    else setUnit(chosen.ingredient.defaultUnit);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!label.trim() || !(value > 0)) return;
    onAdd(label.trim(), value, unit, pick);
    setLabel("");
    setAmount("1");
    setPick(null);
  }

  return (
    <form className="inline-form add-item-form" onSubmit={handleSubmit}>
      <div className="add-item-field">
        <input
          type="text"
          aria-label="Item"
          placeholder="Acrescentar item…"
          required
          maxLength={200}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setPick(null);
          }}
        />
        {pick ? (
          <p className="muted add-item-linked">Ligado a {pick.kind === "product" ? "produto" : "ingrediente"}: {pick.name}</p>
        ) : (
          <SuggestionList suggestions={suggestions} onPick={handlePick} />
        )}
      </div>
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

/** Modo "Ordenar": a lista sem grupos, pela ordem guardada, com setas; grava ao sair. */
function OrderItems({
  items,
  onMove,
  onDone,
  onCancel,
}: {
  items: ShoppingListItemDto[];
  onMove: (index: number, delta: -1 | 1) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <p className="muted">Põe os itens pela ordem em que os vais buscar. Fora deste modo a lista volta a aparecer por corredor.</p>
      <ol className="pantry-list order-list">
        {items.map((item, index) => (
          <li key={item.shoppingListItemId} className="list-row">
            <span className="meal-title">{item.label}</span>
            <span className="order-buttons">
              <button type="button" className="icon-button" aria-label={`Subir ${item.label}`} disabled={index === 0} onClick={() => onMove(index, -1)}>
                ↑
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Descer ${item.label}`}
                disabled={index === items.length - 1}
                onClick={() => onMove(index, 1)}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <div className="button-row">
        <button type="button" className="button-primary" onClick={onDone}>
          Guardar ordem
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </>
  );
}

/** Por comprar, agrupados pela categoria de topo; sem grupos (ou só um), lista simples. */
function PendingItems({
  items,
  groups,
  ...rest
}: {
  items: ShoppingListItemDto[];
  groups: ItemGroup[] | null;
  open: boolean;
  cheapest: Map<string, { chainName: string; lineTotal: number }>;
  packaging: Map<string, ShoppingItemPackagingDto>;
  onToggle: (item: ShoppingListItemDto) => void;
  onDelete: (item: ShoppingListItemDto) => void;
  onLink: (item: ShoppingListItemDto, pick: CatalogPick) => void;
}) {
  if (!groups || groups.length < 2) return <ItemList items={items} {...rest} />;
  return (
    <>
      {groups.map((group) => (
        <section key={group.name} className={`item-group ${aisleClass(group.name === OTHERS_GROUP ? null : aisleOf(group.name))}`}>
          <h3>
            <span className="aisle-dot" aria-hidden="true" />
            {group.name} <span className="muted">({group.items.length})</span>
          </h3>
          <ItemList items={group.items} {...rest} />
        </section>
      ))}
    </>
  );
}

function ItemList({
  items,
  open,
  cheapest,
  packaging,
  onToggle,
  onDelete,
  onLink,
}: {
  items: ShoppingListItemDto[];
  open: boolean;
  cheapest?: Map<string, { chainName: string; lineTotal: number }>;
  packaging?: Map<string, ShoppingItemPackagingDto>;
  onToggle: (item: ShoppingListItemDto) => void;
  onDelete: (item: ShoppingListItemDto) => void;
  onLink?: (item: ShoppingListItemDto, pick: CatalogPick) => void;
}) {
  const [linking, setLinking] = useState<string | null>(null);
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
          {packaging?.get(item.shoppingListItemId) && (
            <span className="pill pill-accent2" title={packaging.get(item.shoppingListItemId)!.productName}>
              comprar {packaging.get(item.shoppingListItemId)!.packageCount} ×{" "}
              {formatQuantity(packaging.get(item.shoppingListItemId)!.packageQuantity, packaging.get(item.shoppingListItemId)!.packageUnit)}
            </span>
          )}
          {item.storedInPantryAt && <span className="pill pill-muted">Na despensa</span>}
          {open && onLink && !item.isPurchased && !item.productId && !item.ingredientId && (
            <button
              type="button"
              className="link-button"
              title="Sem produto ligado: não entra na comparação de lojas"
              onClick={() => setLinking(linking === item.shoppingListItemId ? null : item.shoppingListItemId)}
            >
              Ligar a produto
            </button>
          )}
          {linking === item.shoppingListItemId && onLink && (
            <LinkPicker
              label={item.label}
              onCancel={() => setLinking(null)}
              onPick={(pick) => {
                setLinking(null);
                onLink(item, pick);
              }}
            />
          )}
          {cheapest?.get(item.shoppingListItemId) && (
            <span className="pill pill-good">
              {cheapest.get(item.shoppingListItemId)!.chainName} · {money.format(cheapest.get(item.shoppingListItemId)!.lineTotal)}
            </span>
          )}
          {open && (
            <button type="button" className="icon-danger" aria-label={`Remover ${item.label}`} title="Remover" onClick={() => onDelete(item)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 7h14M10 7V5h4v2M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Unidade base da Api (g, ml) passa a kg/l a partir de 1000. */
function formatQuantity(amount: number, unit: MeasurementUnit): string {
  if (unit === MeasurementUnit.Gram && amount >= 1000) return `${quantityFormat.format(amount / 1000)} kg`;
  if (unit === MeasurementUnit.Milliliter && amount >= 1000) return `${quantityFormat.format(amount / 1000)} l`;
  return `${quantityFormat.format(amount)} ${measurementUnitLabels[unit]}`;
}

function Comparison({ comparison, items }: { comparison: StoreComparisonDto; items: ShoppingListItemDto[] }) {
  const labelOf = (itemId: string) => items.find((i) => i.shoppingListItemId === itemId)?.label ?? "?";
  const { split } = comparison;
  const best = comparison.stores[0];

  // A Api devolve todas as lojas abertas, mesmo sem nenhum item; só interessam as que têm algum.
  const stores = comparison.stores.filter((s) => s.coveredItemCount > 0);
  const anyPrice = stores.length > 0;

  // Divisão agrupada por loja, pela ordem do ranking: "No Lidl: Leite, Massa".
  const splitByStore = comparison.stores
    .map((store) => ({
      chainName: store.chainName,
      labels: split.items.filter((line) => line.storeId === store.storeId).flatMap((line) => line.itemIds.map(labelOf)),
    }))
    .filter((group) => group.labels.length > 0);

  return (
    <div>
      {!anyPrice && (
        <p className="muted">
          Nenhuma loja tem preço recente para {comparison.itemCount === 1 ? "este item" : `estes ${comparison.itemCount} itens`}.
        </p>
      )}
      {anyPrice && (
        <div className="store-grid">
          {stores.map((store, index) => {
            const isBest = store.storeId === best?.storeId;
            const complete = store.coveredItemCount === comparison.itemCount;
            return (
              <ShelfLabel
                key={store.storeId}
                index={index}
                best={isBest}
                band={
                  <VerdictBand tone={isBest ? "1" : complete ? "3" : "none"}>
                    {isBest ? "Mais barato" : complete ? "Tem tudo" : `Falta ${comparison.itemCount - store.coveredItemCount}`}
                  </VerdictBand>
                }
              >
                <div className="label-name">{store.chainName}</div>
                <div className="label-meta">
                  {store.coveredItemCount} de {comparison.itemCount} itens com preço
                </div>
                <LabelPrice amount={store.total} />
                {store.cardTotal < store.total && <div className="label-card">{money.format(store.cardTotal)} com cartão</div>}
              </ShelfLabel>
            );
          })}
        </div>
      )}

      {stores.map((store) => (
        <StoreBreakdown key={store.storeId} store={store} labelOf={labelOf} />
      ))}

      {split.storeCount > 1 && split.savingVsBestStore > 0 && (
        <div className="notice">
          Dividindo a compra por {split.storeCount} lojas: {money.format(split.total)} ({money.format(split.cardTotal)} com cartão),
          menos {money.format(split.savingVsBestStore)} do que tudo no {best?.chainName}.
          <ul className="split-list">
            {splitByStore.map((group) => (
              <li key={group.chainName}>
                <strong>{group.chainName}:</strong> {group.labels.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detalhe recolhido: no corredor a lista de compras tem de caber no primeiro ecrã. */}
      {comparison.unpricedItems.length > 0 && (
        <details className="comparison-details">
          <summary>
            {comparison.unpricedItems.length === 1 ? "1 item sem preço" : `${comparison.unpricedItems.length} itens sem preço`}
          </summary>
          <ul className="unpriced-list">
            {comparison.unpricedItems.map((item) => (
              <li key={item.itemId}>
                {item.label}{" "}
                <span className="muted">
                  {item.reason === UnpricedItemReason.NoProduct ? "sem produto ligado" : "nenhuma loja vende"}
                </span>
              </li>
            ))}
          </ul>
          <p className="muted">Itens escritos à mão só têm preço quando ligados a um produto ou ingrediente.</p>
        </details>
      )}
      {anyPrice && (
        <p className="muted comparison-note">
          Os preços são das embalagens inteiras que tens de comprar, não da parte que a receita usa: 20 g de arroz contam como um pacote de 1 kg.
          Itens iguais de várias receitas contam juntos. Preços dos últimos 3 dias nas lojas online.
        </p>
      )}
    </div>
  );
}

function StoreBreakdown({
  store,
  labelOf,
}: {
  store: StoreComparisonStoreDto;
  labelOf: (itemId: string) => string;
}) {
  // Fechado por defeito: cada item já diz onde é mais barato, e a lista tem de caber no ecrã do corredor.
  return (
    <details className="store-breakdown">
      <summary>
        O que comprar no {store.chainName} · {money.format(store.total)}
      </summary>
      <div className="table-wrap">
      <table className="comparison-table breakdown-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Precisas</th>
            <th>Compras</th>
            <th className="num">Preço</th>
          </tr>
        </thead>
        <tbody>
          {store.items.map((line) => (
            <tr key={line.itemId}>
              <td>
                {line.itemIds.map(labelOf).join(" + ")}
              </td>
              <td>{formatQuantity(line.requiredAmount, line.requiredUnit)}</td>
              <td>
                {line.productName}
                <div className="muted">
                  {line.packageCount} × {line.packageQuantity > 0 ? formatQuantity(line.packageQuantity, line.packageUnit) : "embalagem"} a{" "}
                  {money.format(line.packagePrice)}
                  {!line.quantityComparable && " · quantidade não comparável, conta 1 embalagem"}
                  {line.quantityConverted && " · quantidade aproximada"}
                </div>
              </td>
              <td className="num">
                {money.format(line.lineTotal)}
                {line.cardLineTotal < line.lineTotal && <div className="muted">{money.format(line.cardLineTotal)} com cartão</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {store.missingItemIds.length > 0 && (
        <p className="muted">
          Sem preço no {store.chainName}:{" "}
          {store.missingItemIds.length > 3
            ? `${store.missingItemIds.length} itens`
            : store.missingItemIds.map(labelOf).join(", ")}
          .
        </p>
      )}
    </details>
  );
}
