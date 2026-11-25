import { Busy } from "../components/Busy";
import { useEffect, useState } from "react";
import { useLoad } from "../useLoad";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import {
  consumePantryItem,
  eatLeftovers,
  DiscardReason,
  discardPantryItem,
  discardReasonLabels,
  listPantryItems,
  movePantryItem,
  openPantryItem,
  pantryLocationLabels,
  pantryLocations,
  PantryState,
  pantryStateLabels,
  scanPantryItem,
  type PantryItemDto,
  type PantryLocation,
} from "../api/pantry";
import { lookupBarcode, type BarcodeLookupResult } from "../api/barcodes";
import { ApiError } from "../api/http";
import { measurementUnitLabels, type ChainDto, type ProductDto } from "../api/types";
import { describeError } from "../auth/errors";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { Pagination } from "../components/Pagination";
import { HouseholdGate } from "../household/HouseholdGate";
import { AisleSign } from "../components/AisleSign";
import { useActiveChains } from "../catalog/useChains";
import { describePurchase } from "../pantry/purchase";
import { urgency } from "../pantry/urgency";
import { SearchField } from "../components/SearchField";
import { useProducts } from "../pantry/useProducts";
import { daysBetween, longDate, shortDate, today } from "../plan/dates";
import { usePageSize } from "../usePageSize";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const quantityFormat = numberFormat({ maximumFractionDigits: 2 });

/** "fifo" = o que há, pela ordem em que deve ser usado; os outros são estados. */
type View = "fifo" | PantryState;

const viewLabels = (): [View, string][] => [
  ["fifo", tr().pantry.fifo],
  [PantryState.Sealed, pantryStateLabels[PantryState.Sealed]],
  [PantryState.Open, pantryStateLabels[PantryState.Open]],
  [PantryState.Frozen, pantryStateLabels[PantryState.Frozen]],
  [PantryState.Consumed, pantryStateLabels[PantryState.Consumed]],
  [PantryState.Discarded, pantryStateLabels[PantryState.Discarded]],
];

export function PantryPage() {
  return <HouseholdGate>{(household) => <Pantry household={household} />}</HouseholdGate>;
}

function isLive(item: PantryItemDto) {
  return item.state !== PantryState.Consumed && item.state !== PantryState.Discarded;
}

function ExpiryLabel({ expiresAt }: { expiresAt: string | null }) {
  const t = tr().pantry;
  if (!expiresAt) return <span className="pantry-when">{t.noExpiry}</span>;
  const days = daysBetween(today(), expiresAt);
  if (days < 0) return <span className="pantry-when">{t.expiredOn(longDate(expiresAt))}</span>;
  if (days === 0) return <span className="pantry-when">{t.expiresToday}</span>;
  if (days === 1) return <span className="pantry-when">{t.expiresTomorrow}</span>;
  if (days <= 7) return <span className="pantry-when">{t.expiresInDays(days)}</span>;
  return <span className="pantry-when">{t.until(shortDate(expiresAt))}</span>;
}

function withoutPage(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("page");
  return next;
}

function Pantry({ household }: { household: CallerHouseholdDto }) {
  const pageSize = usePageSize(50, 15);
  const householdId = household.householdId;
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get("ver");
  const view: View = rawView === null ? "fifo" : (Number(rawView) as PantryState);
  const rawLocation = searchParams.get("local");
  const locationFilter = rawLocation === null ? undefined : (Number(rawLocation) as PantryLocation);
  const page = Number(searchParams.get("page") ?? "1") || 1;

  // A pesquisa vai à Api (o nome vive em Products): procura em todos os itens, não só nos da página.
  // O pedido só sai quando se pára de escrever.
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  // A lista anterior fica no ecrã enquanto a nova carrega (filtro, página, depois de uma ação).
  const list = useLoad(
    [householdId, view, locationFilter, query, page, pageSize],
    () =>
      listPantryItems(householdId, {
        // O que há e os estados com stock: a validade mais curta primeiro.
        // Consumidos e descartados ficam pela data de compra.
        sort: view === PantryState.Consumed || view === PantryState.Discarded ? undefined : "expiry",
        state: view === "fifo" ? undefined : view,
        location: locationFilter,
        search: query === "" ? undefined : query,
        page,
        pageSize: pageSize,
      }),
    { keepPrevious: true },
  );
  const items: PantryItemDto[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const loading = list.loading;
  const [actionError, setError] = useState<string | null>(null);
  const error = actionError ?? list.error;
  const products = useProducts(items.map((item) => item.productId));
  const chains = useActiveChains();

  useEffect(() => {
    const next = search.trim();
    if (next === query) return;
    const timer = setTimeout(() => {
      setQuery(next);
      // Os resultados são outros: voltar à primeira página.
      if (page > 1) setSearchParams(withoutPage(searchParams), { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, query, page, searchParams, setSearchParams]);

  function setFilter(next: { view?: View; location?: PantryLocation | null; page?: number }) {
    const params = new URLSearchParams();
    const nextView = next.view ?? view;
    const nextLocation = next.location === undefined ? locationFilter : next.location;
    if (nextView !== "fifo") params.set("ver", String(nextView));
    if (nextLocation !== undefined && nextLocation !== null) params.set("local", String(nextLocation));
    if ((next.page ?? 1) > 1) params.set("page", String(next.page));
    setSearchParams(params, { replace: true });
  }

  const searching = query !== "";

  async function act(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      list.reload();
    } catch (err) {
      setError(describeError(err, { "invalid-state-transition": tr().pantry.actionNotAllowed }));
    }
  }

  return (
    <div className="page pantry-page">
      <header className="page-head">
        <div>
          <h1>{tr().pantry.title}</h1>
          <p className="page-head-sub">
            {household.name}
            {!loading && total > 0 && tr().pantry.items(total)}
          </p>
        </div>
        <div className="button-row">
          <Link to="/despensa/desperdicio" className="button-secondary">
            {tr().pantry.waste}
          </Link>
          <Link to="/despensa/adicionar" className="button-primary button-lg">
            {tr().pantry.add}
          </Link>
        </div>
      </header>
      {notice && <p className="notice">{notice}</p>}

      <div className="filter-row">
        <SearchField value={search} label={tr().pantry.search} placeholder={tr().pantry.searchPlaceholder} onChange={setSearch} />
        <select
          className="category-select"
          aria-label={tr().pantry.view}
          value={String(view)}
          onChange={(e) => setFilter({ view: e.target.value === "fifo" ? "fifo" : (Number(e.target.value) as PantryState) })}
        >
          {viewLabels().map(([value, label]) => (
            <option key={String(value)} value={String(value)}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="category-select"
          aria-label={tr().pantry.location}
          value={locationFilter === undefined ? "" : String(locationFilter)}
          onChange={(e) => setFilter({ location: e.target.value === "" ? null : (Number(e.target.value) as PantryLocation) })}
        >
          <option value="">{tr().pantry.allLocations}</option>
          {pantryLocations.map((loc) => (
            <option key={loc} value={loc}>
              {pantryLocationLabels[loc]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted loading">{tr().common.loading}</p>}

      {!loading && items.length === 0 && searching ? (
        <p className="empty-state">
          {tr().pantry.noMatch(query)}{" "}
          <button type="button" className="link-button" onClick={() => setSearch("")}>
            {tr().pantry.clearSearch}
          </button>
        </p>
      ) : !loading && items.length === 0 ? (
        <p className="empty-state">
          {view === "fifo" ? tr().pantry.empty : tr().pantry.nothingInState}{" "}
          {view === "fifo" && <Link to="/despensa/adicionar">{tr().pantry.addFirst}</Link>}
        </p>
      ) : (
        !loading && (
          <ul className="pantry-list">
            {items.map((item) => (
              <PantryRow
                key={item.pantryItemId}
                item={item}
                product={products.get(item.productId)}
                chains={chains}
                onAct={act}
                householdId={householdId}
                memberId={household.memberId}
              />
            ))}
          </ul>
        )
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(nextPage) => setFilter({ page: nextPage })} />
    </div>
  );
}

function PantryRow({
  item,
  product,
  chains,
  householdId,
  memberId,
  onAct,
}: {
  item: PantryItemDto;
  product: ProductDto | undefined;
  chains: ChainDto[] | null;
  householdId: string;
  /** Quem está na app: "Comer 1 dose" conta para esta pessoa. */
  memberId: string;
  onAct: (action: () => Promise<unknown>) => void;
}) {
  const [mode, setMode] = useState<"consume" | "discard" | "scan" | null>(null);
  const [scan, setScan] = useState<{ barcode: string; result: BarcodeLookupResult | null } | "searching" | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<DiscardReason>(DiscardReason.Expired);
  const unit = measurementUnitLabels[item.quantity.unit];
  const live = isLive(item);
  // O que a casa leu na embalagem que comprou ganha ao produto da cadeia.
  const thumb = item.scanned?.imageUrl ?? product?.imageUrl;
  const title = item.scanned?.name ?? product?.name ?? "…";
  const purchase = describePurchase(item, chains);

  async function onScanned(barcode: string) {
    setScan("searching");
    setScanError(null);
    try {
      setScan({ barcode, result: await lookupBarcode(barcode) });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setScan({ barcode, result: null });
      } else {
        setScan(null);
        setScanError(describeError(err));
      }
    }
  }

  function saveScan(scanned: { barcode: string; result: BarcodeLookupResult | null }) {
    const { result } = scanned;
    onAct(() =>
      scanPantryItem(householdId, item.pantryItemId, {
        barcode: result?.barcode ?? scanned.barcode,
        name: result?.name ?? null,
        brand: result?.brand ?? null,
        imageUrl: result?.imageUrl ?? null,
      }),
    );
    closeScan();
  }

  function closeScan() {
    setMode(null);
    setScan(null);
    setScanError(null);
  }

  function consumePart() {
    const value = Number(amount.replace(",", "."));
    if (!(value > 0)) return;
    onAct(() => consumePantryItem(householdId, item.pantryItemId, value));
    setMode(null);
    setAmount("");
  }

  return (
    <li className={live ? `pantry-row urgency-${urgency(item.expiresAt).level}` : "pantry-row is-gone"}>
      <span className="urgency-dot" aria-hidden="true" />
      <div className="pantry-main">
        <div className={`pantry-thumb${thumb ? "" : " is-empty"}`}>
          {thumb ? <img src={thumb} alt="" loading="lazy" /> : <AisleSign aisle={null} />}
        </div>
        <div className="pantry-text">
          <Link to={`/produtos/${item.productId}`} className="meal-title">
            {title}
          </Link>
          {item.scanned?.brand && <span className="meal-meta muted">{item.scanned.brand}</span>}
          <span className="meal-meta muted">
            {quantityFormat.format(item.quantity.amount)} {unit} · {pantryStateLabels[item.state]}
            {!live && ` · ${pantryLocationLabels[item.location]}`}
          </span>
          {purchase && <span className="meal-meta muted">{purchase}</span>}
        </div>
      </div>
      <div className="pantry-expiry">{live && <ExpiryLabel expiresAt={item.expiresAt} />}</div>
      {live && (
        <div className="pantry-actions">
          <select
            className="category-select"
            aria-label={tr().pantry.location}
            value={item.location}
            onChange={(e) => onAct(() => movePantryItem(householdId, item.pantryItemId, Number(e.target.value) as PantryLocation))}
          >
            {pantryLocations.map((loc) => (
              <option key={loc} value={loc}>
                {pantryLocationLabels[loc]}
              </option>
            ))}
          </select>
          {item.sourceMealId && item.quantity.amount >= 1 && (
            <button
              type="button"
              className="row-action"
              title={tr().pantry.eatLeftoversHint}
              onClick={() => onAct(() => eatLeftovers(householdId, item.pantryItemId, mealTypeNow(), 1, [memberId]))}
            >
              {tr().pantry.eatLeftovers}
            </button>
          )}
          {item.state === PantryState.Sealed && !item.sourceMealId && (
            <button type="button" className="row-action" onClick={() => onAct(() => openPantryItem(householdId, item.pantryItemId))}>
              {tr().pantry.open}
            </button>
          )}
          <button
            type="button"
            className="row-action"
            aria-expanded={mode === "consume"}
            onClick={() => setMode(mode === "consume" ? null : "consume")}
          >
            {tr().pantry.use}
          </button>
          <button
            type="button"
            className="row-action"
            aria-expanded={mode === "scan"}
            onClick={() => (mode === "scan" ? closeScan() : setMode("scan"))}
          >
            {item.scanned ? tr().pantry.rescan : tr().pantry.scan}
          </button>
          <button
            type="button"
            className="button-danger"
            aria-expanded={mode === "discard"}
            onClick={() => setMode(mode === "discard" ? null : "discard")}
          >
            {tr().pantry.throwAway}
          </button>
        </div>
      )}

      {mode === "consume" && (
        <div className="inline-form pantry-inline">
          <input
            type="text"
            inputMode="decimal"
            aria-label={tr().pantry.usedQuantity(unit)}
            placeholder={tr().pantry.howMuch(unit)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="button" className="button-secondary" onClick={consumePart} disabled={!(Number(amount.replace(",", ".")) > 0)}>
            {tr().pantry.useThis}
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              onAct(() => consumePantryItem(householdId, item.pantryItemId));
              setMode(null);
            }}
          >
            {tr().pantry.useAll}
          </button>
        </div>
      )}

      {mode === "scan" && (
        <div className="pantry-inline pantry-scan">
          {scanError && (
            <p className="form-error" role="alert">
              {scanError}
            </p>
          )}
          {scan === null && <BarcodeScanner onScan={onScanned} />}
          {scan === "searching" && <p className="muted loading loading-text"><Busy>{tr().lists2.searching}</Busy></p>}
          {scan !== null && scan !== "searching" && (
            <div className="scan-result">
              {scan.result ? (
                <>
                  {scan.result.imageUrl && <img src={scan.result.imageUrl} alt="" className="scan-image" />}
                  <div className="pantry-text">
                    <strong>{scan.result.name}</strong>
                    {scan.result.brand && <span className="muted">{scan.result.brand}</span>}
                  </div>
                </>
              ) : (
                <p className="muted">{tr().pantry.unknownCode(scan.barcode)}</p>
              )}
              <button type="button" className="button-primary" onClick={() => saveScan(scan)}>
                {tr().common.save}
              </button>
              <button type="button" className="button-secondary" onClick={() => setScan(null)}>
                {tr().pantry.scanAnother}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "discard" && (
        <div className="inline-form pantry-inline">
          <select
            className="category-select"
            aria-label={tr().pantry.reason}
            value={reason}
            onChange={(e) => setReason(Number(e.target.value) as DiscardReason)}
          >
            {Object.entries(discardReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              onAct(() => discardPantryItem(householdId, item.pantryItemId, reason));
              setMode(null);
            }}
          >
            {tr().pantry.throwAway}
          </button>
        </div>
      )}
    </li>
  );
}

/** A refeição pela hora local: pequeno-almoço até às 11h, almoço até às 16h, lanche até às 19h, depois jantar. */
function mealTypeNow(now = new Date()): number {
  const hour = now.getHours();
  if (hour < 11) return 0;
  if (hour < 16) return 1;
  if (hour < 19) return 3;
  return 2;
}
