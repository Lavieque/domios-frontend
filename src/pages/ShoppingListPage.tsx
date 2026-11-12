import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
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
  fillIngredientConversion,
  linkShoppingListItem,
  renameShoppingList,
  reopenShoppingList,
  reorderShoppingListItems,
  setItemPurchased,
  setShoppingListItemPaidPrice,
  setShoppingListItemStore,
  setShoppingListStore,
  PaidPriceSource,
  ShoppingListStatus,
  storeShoppingListInPantry,
  shoppingListStatusLabels,
  UnpricedItemReason,
  type ShoppingListDto,
  type ShoppingItemPackagingDto,
  type ShoppingListItemDto,
  type StoreComparisonDto,
  type StoreComparisonStoreDto,
  type MissingConversionDto,
  type StoreInPantryResultDto,
} from "../api/shopping";
import { PantryLocation, pantryLocationLabels, pantryLocations } from "../api/pantry";
import { MeasurementUnit, measurementUnitLabels, type ChainDto } from "../api/types";
import { describeError } from "../auth/errors";
import { aisleClass, aisleOf } from "../catalog/aisles";
import { useCategories } from "../catalog/useCategories";
import { useActiveChains } from "../catalog/useChains";
import { getDevicePosition, PositionError } from "../catalog/devicePosition";
import { ChainLogo } from "../components/ChainLogo";
import { HouseholdGate } from "../household/HouseholdGate";
import { useProducts } from "../pantry/useProducts";
import { groupByTopCategory, OTHERS_GROUP, type ItemGroup } from "../shopping/groups";
import { moveItem, withPendingOrder } from "../shopping/order";
import { rankStores } from "../shopping/storeRanking";
import { LinkPicker, SuggestionList, useCatalogSuggestions, type CatalogPick } from "../shopping/CatalogSuggestions";

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const kmFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });
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
  // "Contar deslocação": pede a posição do dispositivo e soma a ida às lojas físicas mais perto.
  const [withTravel, setWithTravel] = useState(false);
  // Aviso antes de comparar: linhas escritas à mão que ainda não estão ligadas a um produto.
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [packaging, setPackaging] = useState<Map<string, ShoppingItemPackagingDto>>(new Map());
  // Modo "Ordenar": ids dos itens por comprar pela ordem que se está a montar; null fora do modo.
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  // Produtos das linhas (agrupar e miniaturas) e os das embalagens a comprar (miniatura das linhas só com ingrediente).
  const products = useProducts([
    ...(list?.items.flatMap((item) => (item.productId ? [item.productId] : [])) ?? []),
    ...[...packaging.values()].map((p) => p.productId),
  ]);
  const categories = useCategories();
  const chains = useActiveChains();

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

  async function compare(travel = withTravel) {
    setCheckingLinks(false);
    setComparing(true);
    try {
      const origin = travel ? await getDevicePosition() : undefined;
      setComparison(await getStoreComparison(householdId, listId, origin));
    } catch (err) {
      if (err instanceof PositionError) setWithTravel(false);
      setError(err instanceof PositionError ? err.message : describeError(err, { "invalid-argument": "As lojas físicas só existem em Portugal." }));
    } finally {
      setComparing(false);
    }
  }

  function toggleTravel(on: boolean) {
    setWithTravel(on);
    if (comparison) void compare(on);
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
  // Miniatura: a do produto da linha; numa linha só com ingrediente, a da embalagem que se vai comprar.
  const thumbs = new Map<string, string>();
  for (const item of list.items) {
    const productId = item.productId ?? packaging.get(item.shoppingListItemId)?.productId;
    const imageUrl = productId ? products.get(productId)?.imageUrl : null;
    if (imageUrl) thumbs.set(item.shoppingListItemId, imageUrl);
  }
  const notInPantry = purchased.filter((item) => !item.storedInPantryAt);

  return (
    <div className="page list-page">
      <Link to="/listas" className="back-link">
        Listas de compras
      </Link>
      <header className="list-head">
        <span className="list-tally-count" aria-hidden="true">
          {pending.length}
        </span>
        <div className="list-head-text">
          <ListName list={list} onRename={(name) => act(() => renameShoppingList(householdId, listId, name))} />
          <p className="page-head-sub">
            {list.status !== ShoppingListStatus.Open && (
              <span className={`status-tag status-${list.status}`}>{shoppingListStatusLabels[list.status]}</span>
            )}{" "}
            {pending.length} por comprar de {list.items.length} · {household.name}
          </p>
          {list.status !== ShoppingListStatus.Cancelled && (
            <ListStore
              chains={chains}
              chainId={list.chainId ?? null}
              onChange={(chainId) => act(() => setShoppingListStore(householdId, listId, chainId))}
            />
          )}
        </div>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="list-layout">
        <div className="list-main">
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
                  thumbs={thumbs}
                  onToggle={(item) => act(() => setItemPurchased(householdId, listId, item.shoppingListItemId, true))}
                  onDelete={(item) => act(() => deleteShoppingListItem(householdId, listId, item.shoppingListItemId))}
                  onLink={link}
                />
              )}
              {purchased.length > 0 && (
                <>
                  <h2>Comprados ({purchased.length})</h2>
                  <PurchasedTotal items={purchased} />
                  <ItemList
                    items={purchased}
                    open={open}
                    packaging={packaging}
                    thumbs={thumbs}
                    onToggle={(item) => act(() => setItemPurchased(householdId, listId, item.shoppingListItemId, false))}
                    onDelete={(item) => act(() => deleteShoppingListItem(householdId, listId, item.shoppingListItemId))}
                    pricing={
                      list.status === ShoppingListStatus.Cancelled
                        ? undefined
                        : {
                            chains,
                            listChainId: list.chainId ?? null,
                            // Sem act(): um erro fica no formulário da linha, que não fecha.
                            onSave: async (item, amount, chainId) => {
                              try {
                                if (chainId !== (item.chainId ?? null)) {
                                  await setShoppingListItemStore(householdId, listId, item.shoppingListItemId, chainId);
                                }
                                if (amount !== undefined) {
                                  await setShoppingListItemPaidPrice(householdId, listId, item.shoppingListItemId, amount);
                                }
                              } finally {
                                // A loja pode ter mudado mesmo que o preço falhe.
                                setVersion((v) => v + 1);
                              }
                            },
                          }
                    }
                  />
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

        {pending.length > 0 && (
          <aside className="list-side">
            <section className="side-block comparison-panel">
              <div className="side-head">
                <h2>Onde fica mais barato</h2>
              </div>
              {checkingLinks && unlinked.length > 0 && (
                <UnlinkedWarning items={unlinked} onLink={link} onCompareAnyway={() => void compare()} onCancel={() => setCheckingLinks(false)} />
              )}
              <label className="travel-toggle">
                <input type="checkbox" checked={withTravel} disabled={comparing} onChange={(e) => toggleTravel(e.target.checked)} />
                Contar deslocação <span className="muted">(usa a tua localização, que não fica guardada)</span>
              </label>
              {!comparison ? (
                !checkingLinks && (
                  <>
                    <p className="side-empty">Os preços das lojas dos últimos 3 dias, item a item.</p>
                    <button type="button" className="button-secondary" onClick={() => void startCompare()} disabled={comparing}>
                      {comparing ? "A comparar…" : "Comparar lojas"}
                    </button>
                  </>
                )
              ) : (
                <Comparison comparison={comparison} items={list.items} householdId={householdId} onRecompare={() => compare()} />
              )}
            </section>
          </aside>
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
  thumbs: Map<string, string>;
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
  thumbs,
  onToggle,
  onDelete,
  onLink,
  pricing,
}: {
  items: ShoppingListItemDto[];
  open: boolean;
  cheapest?: Map<string, { chainName: string; lineTotal: number }>;
  packaging?: Map<string, ShoppingItemPackagingDto>;
  /** Imagem por linha; sem nenhuma nesta lista, não se reserva o espaço. */
  thumbs?: Map<string, string>;
  onToggle: (item: ShoppingListItemDto) => void;
  onDelete: (item: ShoppingListItemDto) => void;
  onLink?: (item: ShoppingListItemDto, pick: CatalogPick) => void;
  /** Só nas compradas: preço pago e loja da linha. */
  pricing?: PricingProps;
}) {
  const [linking, setLinking] = useState<string | null>(null);
  const withThumbs = thumbs !== undefined && items.some((item) => thumbs.has(item.shoppingListItemId));
  return (
    <ul className="pantry-list">
      {items.map((item) => (
        <li key={item.shoppingListItemId} className={`list-row${item.isPurchased ? " is-purchased" : ""}`}>
          <label className="item-check">
            <input type="checkbox" checked={item.isPurchased} disabled={!open} onChange={() => onToggle(item)} />
            {withThumbs && (
              <span className={`list-thumb${thumbs.has(item.shoppingListItemId) ? "" : " is-empty"}`} aria-hidden="true">
                {thumbs.has(item.shoppingListItemId) && (
                  <img
                    src={thumbs.get(item.shoppingListItemId)}
                    alt=""
                    loading="lazy"
                    // Imagem da loja que deixou de existir: fica a caixa vazia, sem o ícone partido.
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                )}
              </span>
            )}
            <span className="meal-title" title={item.label}>{item.label}</span>
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
          {pricing && item.isPurchased && <PaidPrice item={item} {...pricing} />}
          {open && onLink && !item.isPurchased && !item.productId && !item.ingredientId && (
            <button
              type="button"
              className="link-button list-row-link"
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
            <span className="list-row-price">
              {cheapest.get(item.shoppingListItemId)!.chainName}{" "}
              <span className="price-tag">{money.format(cheapest.get(item.shoppingListItemId)!.lineTotal)}</span>
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

interface PricingProps {
  chains: ChainDto[] | null;
  listChainId: string | null;
  /** `amount`: undefined não mexe no preço; null volta ao da prateleira. `chainId`: null segue a lista. */
  onSave: (item: ShoppingListItemDto, amount: number | null | undefined, chainId: string | null) => Promise<void>;
}

/** Onde se fez (ou se vai fazer) a compra: dá o preço da prateleira às linhas compradas. */
function ListStore({ chains, chainId, onChange }: { chains: ChainDto[] | null; chainId: string | null; onChange: (chainId: string | null) => void }) {
  if (!chains) return null;
  return (
    <label className="list-store">
      <span className="muted">Compras no</span>
      <select className="category-select" value={chainId ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Loja por escolher</option>
        {chains.map((chain) => (
          <option key={chain.chainId} value={chain.chainId}>
            {chain.name}
          </option>
        ))}
        {/* A cadeia guardada pode ter fechado entretanto: mostra-se na mesma. */}
        {chainId && !chains.some((c) => c.chainId === chainId) && <option value={chainId}>Loja fechada</option>}
      </select>
    </label>
  );
}

/** Soma do que já se pagou nesta lista, com a parte estimada pela prateleira à parte. */
function PurchasedTotal({ items }: { items: ShoppingListItemDto[] }) {
  const priced = items.filter((item) => item.paidPrice?.currency === "EUR");
  if (priced.length === 0) return null;
  const total = priced.reduce((sum, item) => sum + item.paidPrice!.amount, 0);
  const estimated = priced
    .filter((item) => item.paidPriceSource === PaidPriceSource.Offer)
    .reduce((sum, item) => sum + item.paidPrice!.amount, 0);
  const missing = items.length - priced.length;
  return (
    <p className="muted purchased-total">
      Pago: <strong className="price-tag">{money.format(total)}</strong>
      {estimated > 0 && ` · ${money.format(estimated)} pelo preço da prateleira`}
      {missing > 0 && ` · ${missing === 1 ? "1 item sem preço" : `${missing} itens sem preço`}`}
    </p>
  );
}

/** Preço de uma linha comprada: o escrito, o da prateleira, ou nenhum; abre um formulário curto. */
function PaidPrice({ item, chains, listChainId, onSave }: { item: ShoppingListItemDto } & PricingProps) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [chainId, setChainId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typed = item.paidPriceSource === PaidPriceSource.Typed;
  const chainName = (id: string | null | undefined) => chains?.find((c) => c.chainId === id)?.name ?? null;
  const ownChain = item.chainId ? chainName(item.chainId) : null;

  function start() {
    setAmount(typed && item.paidPrice ? String(item.paidPrice.amount).replace(".", ",") : "");
    setChainId(item.chainId ?? "");
    setError(null);
    setEditing(true);
  }

  async function save(nextAmount: number | null | undefined) {
    setSaving(true);
    setError(null);
    try {
      await onSave(item, nextAmount, chainId || null);
      setEditing(false);
    } catch (err) {
      setError(
        describeError(err, {
          "invalid-state-transition": "A lista foi cancelada: já não aceita preços.",
          "invalid-argument": "Escreve um valor entre 0 e 10 000 €.",
          "not-found": "Esta loja já não existe.",
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = amount.trim();
    if (text === "") {
      // Sem valor: só a loja muda; o preço escrito, se havia, fica.
      void save(undefined);
      return;
    }
    const value = Number(text.replace(",", "."));
    if (!Number.isFinite(value) || value < 0 || value > 10000) {
      setError("Escreve um valor entre 0 e 10 000 €.");
      return;
    }
    void save(Math.round(value * 100) / 100);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="link-button paid-price"
        title={typed ? "Preço escrito por ti" : item.paidPrice ? "Preço da prateleira no dia da compra" : "Escrever quanto pagaste"}
        onClick={start}
      >
        {item.paidPrice ? (
          <>
            <span className="price-tag">{money.format(item.paidPrice.amount)}</span>
            {!typed && <span className="muted"> prateleira</span>}
          </>
        ) : (
          "Quanto pagaste?"
        )}
        {ownChain && <span className="muted"> · {ownChain}</span>}
      </button>
    );
  }

  const listChain = chainName(listChainId);
  return (
    <form className="inline-form paid-price-form" onSubmit={submit}>
      <label>
        <span className="muted">Pago (total da linha)</span>{" "}
        <input
          type="text"
          inputMode="decimal"
          className="amount-input"
          placeholder={item.paidPrice && !typed ? String(item.paidPrice.amount).replace(".", ",") : "0,00"}
          aria-label={`Quanto pagaste por ${item.label}, em euros`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />{" "}
        €
      </label>
      {chains && (
        <select className="category-select" aria-label="Loja desta linha" value={chainId} onChange={(e) => setChainId(e.target.value)}>
          <option value="">{listChain ? `Como a lista (${listChain})` : "Como a lista"}</option>
          {chains.map((chain) => (
            <option key={chain.chainId} value={chain.chainId}>
              {chain.name}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className="button-primary" disabled={saving}>
        {saving ? "A guardar…" : "Guardar"}
      </button>
      {typed && (
        <button type="button" className="link-button" disabled={saving} onClick={() => void save(null)} title="Apaga o valor escrito">
          Usar preço da prateleira
        </button>
      )}
      <button type="button" className="link-button" onClick={() => setEditing(false)}>
        Cancelar
      </button>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}

/** Unidade base da Api (g, ml) passa a kg/l a partir de 1000. */
function formatQuantity(amount: number, unit: MeasurementUnit): string {
  if (unit === MeasurementUnit.Gram && amount >= 1000) return `${quantityFormat.format(amount / 1000)} kg`;
  if (unit === MeasurementUnit.Milliliter && amount >= 1000) return `${quantityFormat.format(amount / 1000)} l`;
  return `${quantityFormat.format(amount)} ${measurementUnitLabels[unit]}`;
}

function Comparison({
  comparison,
  items,
  householdId,
  onRecompare,
}: {
  comparison: StoreComparisonDto;
  items: ShoppingListItemDto[];
  householdId: string;
  onRecompare: () => Promise<void>;
}) {
  const labelOf = (itemId: string) => items.find((i) => i.shoppingListItemId === itemId)?.label ?? "?";
  const { split } = comparison;
  // A loja de referência da Api para a divisão de compra (sem deslocação).
  const splitBest = comparison.stores.find((s) => s.storeId === split.bestStoreId) ?? comparison.stores[0];

  // A Api devolve todas as lojas abertas, mesmo sem nenhum item; só interessam as que têm algum.
  // Com a deslocação contada, o "Mais barato" é pelo total com a ida à loja (rankStores).
  const stores = rankStores(
    comparison.stores.filter((s) => s.coveredItemCount > 0),
    comparison.travel?.status === "Included",
  );
  const best = stores[0];
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
              <div key={store.storeId} className={`store-card${isBest ? " is-best" : ""}`} style={{ "--i": index } as CSSProperties}>
                <ChainLogo chainName={store.chainName} />
                <div className="store-card-text">
                  <strong>{store.chainName}</strong>
                  <span>
                    {store.coveredItemCount} de {comparison.itemCount} itens com preço
                  </span>
                </div>
                <div className="store-card-price">
                  <span className="price-tag">{money.format(store.totalWithTravel ?? store.total)}</span>
                  {store.totalWithTravel != null && store.travelCost != null && store.nearestStore ? (
                    <span>
                      Artigos {money.format(store.total)} + deslocação {money.format(store.travelCost)} ({kmFormat.format(store.nearestStore.roundTripKm)} km)
                    </span>
                  ) : (
                    store.cardTotal < store.total && <span>{money.format(store.cardTotal)} com cartão</span>
                  )}
                </div>
                {store.nearestStore && <span className="store-card-near muted">{store.nearestStore.name}</span>}
                <span className={isBest ? "badge" : complete ? "badge badge-soft" : "badge badge-warn"}>
                  {isBest ? "Mais barato" : complete ? "Tem tudo" : `Falta ${comparison.itemCount - store.coveredItemCount}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {stores.map((store) => (
        <StoreBreakdown key={store.storeId} store={store} labelOf={labelOf} householdId={householdId} onRecompare={onRecompare} />
      ))}

      {comparison.travel?.status === "NoStoresInRange" && (
        <p className="muted">
          Nenhuma loja destas cadeias a menos de {kmFormat.format(comparison.travel.radiusKm)} km: os totais não contam a deslocação. O raio muda-se
          em <Link to="/casa">Casa</Link>.
        </p>
      )}
      {comparison.splitWithTravel && comparison.splitWithTravel.storeCount > 1 && (
        <div className="notice">
          Contando a deslocação, dividir por {comparison.splitWithTravel.storeCount} lojas dá {money.format(comparison.splitWithTravel.totalWithTravel)}:
          artigos {money.format(comparison.splitWithTravel.total)} + deslocação {money.format(comparison.splitWithTravel.travelCost)} (
          {kmFormat.format(comparison.splitWithTravel.routeKm)} km).
        </div>
      )}
      {split.storeCount > 1 && split.savingVsBestStore > 0 && comparison.travel?.status !== "Included" && (
        <div className="notice">
          Dividindo a compra por {split.storeCount} lojas: {money.format(split.total)} ({money.format(split.cardTotal)} com cartão),
          menos {money.format(split.savingVsBestStore)} do que tudo no {splitBest?.chainName}.
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
          {comparison.travel?.status === "Included" &&
            ` Deslocação: ida e volta à loja mais perto de cada cadeia, a ${money.format(comparison.travel.costPerKm)}/km. Lojas © OpenStreetMap contributors.`}
        </p>
      )}
    </div>
  );
}

/**
 * A linha conta 1 embalagem porque falta o peso de uma unidade (ou a densidade). O valor fica no
 * catálogo, para todas as casas, e só se ninguém o tiver escrito antes (Api, adenda 2026-11-06 (c)).
 */
function ConversionAsk({
  householdId,
  missing,
  onSaved,
}: {
  householdId: string;
  missing: MissingConversionDto;
  onSaved: () => Promise<void>;
}) {
  const [grams, setGrams] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDensity = missing.field === "Density";

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(grams.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Escreve um número maior que zero.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await fillIngredientConversion(
        householdId,
        missing.ingredientId,
        isDensity ? { densityGramsPerMilliliter: value / 1000 } : { unitWeightGrams: value },
      );
      await onSaved();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="conversion-ask" onSubmit={submit}>
      <label>
        Conta 1 embalagem. {isDensity ? "1 l" : "1 un"} ≈{" "}
        <input
          type="text"
          inputMode="decimal"
          size={5}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          aria-label={isDensity ? "Gramas num litro" : "Gramas numa unidade"}
        />{" "}
        g
      </label>{" "}
      <button type="submit" className="link-button" disabled={saving || grams.trim() === ""}>
        {saving ? "A guardar…" : "Guardar"}
      </button>
      <div className="muted">Fica para todas as casas.</div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}

function StoreBreakdown({
  store,
  labelOf,
  householdId,
  onRecompare,
}: {
  store: StoreComparisonStoreDto;
  labelOf: (itemId: string) => string;
  householdId: string;
  onRecompare: () => Promise<void>;
}) {
  // Fechado por defeito: cada item já diz onde é mais barato, e a lista tem de caber no ecrã do corredor.
  return (
    <details className="store-breakdown">
      <summary>
        <ChainLogo chainName={store.chainName} size="sm" />
        <span className="store-breakdown-name">O que comprar no {store.chainName}</span>
        <span className="store-breakdown-total">{money.format(store.total)}</span>
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
                  {!line.quantityComparable && !line.missingConversion && " · quantidade não comparável, conta 1 embalagem"}
                  {line.quantityConverted && " · quantidade aproximada"}
                </div>
                {line.missingConversion && (
                  <ConversionAsk householdId={householdId} missing={line.missingConversion} onSaved={onRecompare} />
                )}
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
