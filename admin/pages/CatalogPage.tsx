import { useState, type FormEvent } from "react";
import { admin, type CatalogProduct, type CatalogPromotion, type CatalogStore } from "../api";
import { ConfirmAction, PageHead, Pager, State } from "../components";
import { dateOnly, describe, useLoad } from "../hooks";

const TABS = [
  { value: "products", label: "Produtos" },
  { value: "stores", label: "Lojas" },
  { value: "promotions", label: "Promoções" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export function CatalogPage() {
  const [tab, setTab] = useState<Tab>("products");
  return (
    <>
      <PageHead title="Catálogo" sub="Produtos, lojas e promoções. Cada alteração fica na auditoria; a recolha de preços continua a escrever à parte." />
      <div className="chip-row" role="group" aria-label="Secção">
        {TABS.map((t) => (
          <button key={t.value} type="button" className="chip" aria-pressed={tab === t.value} onClick={() => setTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "products" && <ProductsSection />}
      {tab === "stores" && <StoresSection />}
      {tab === "promotions" && <PromotionsSection />}
    </>
  );
}

const PRODUCT_STATUS: Record<number, { label: string; pill: string }> = {
  0: { label: "Ativo", pill: "pill-good" },
  1: { label: "Descontinuado", pill: "pill-muted" },
  2: { label: "Sazonal", pill: "pill-navy" },
};

function ProductsSection() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useLoad(() => admin.products(search, page), [search, page]);
  const items = list.data?.items ?? [];

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch(draft.trim());
    setPage(1);
  }

  return (
    <>
      <form className="search" onSubmit={submit} role="search">
        <input type="search" aria-label="Procurar produtos" placeholder="Procurar por nome ou marca…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="button-secondary">
          Procurar
        </button>
      </form>
      {list.data && <p className="count">{list.data.total} produtos</p>}
      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem produtos." />
      {items.length > 0 && (
        <ul className="rows">
          {items.map((p) => (
            <ProductRow key={p.productId} product={p} onChanged={list.reload} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function ProductRow({ product: p, onChanged }: { product: CatalogProduct; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name);
  const [brand, setBrand] = useState(p.brand ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = PRODUCT_STATUS[p.status] ?? { label: String(p.status), pill: "pill-muted" };

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await admin.updateProduct(p.productId, { name: name.trim(), brand: brand.trim() });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="row row-edit">
        <form className="rename" onSubmit={save}>
          <input type="text" aria-label="Nome" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          <input type="text" aria-label="Marca" maxLength={120} placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <button type="submit" className="button-primary" disabled={busy || !name.trim()}>
            {busy ? "A guardar…" : "Guardar"}
          </button>
          <button type="button" className="button-secondary" disabled={busy} onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
      </li>
    );
  }

  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{p.name}</strong>
          {p.brand && <span className="muted">{p.brand}</span>}
        </div>
        <p className="row-meta">
          {p.category.name}
          {p.barcode && <> · <code>{p.barcode}</code></>}
        </p>
      </div>
      <div className="row-state">
        <span className={`pill ${status.pill}`}>{status.label}</span>
      </div>
      <div className="row-actions">
        <button type="button" className="row-action" onClick={() => setEditing(true)}>
          Editar
        </button>
        {p.status !== 1 && (
          <ConfirmAction
            label="Descontinuar"
            confirmLabel="Descontinuar produto"
            tone="danger"
            onConfirm={async () => {
              await admin.discontinueProduct(p.productId);
              onChanged();
            }}
          />
        )}
      </div>
    </li>
  );
}

function StoresSection() {
  const chains = useLoad(() => admin.chains(), []);
  const [page, setPage] = useState(1);
  const stores = useLoad(() => admin.stores(page), [page]);
  const chainName = new Map((chains.data ?? []).map((c) => [c.chainId, c.name]));
  const storeItems = stores.data?.items ?? [];

  return (
    <>
      <h2>Cadeias</h2>
      <State loading={chains.loading} error={chains.error} empty={(chains.data ?? []).length === 0} emptyText="Sem cadeias." />
      {(chains.data ?? []).length > 0 && (
        <ul className="rows">
          {(chains.data ?? []).map((c) => (
            <OpenRow
              key={c.chainId}
              title={c.name}
              open={c.status === 0}
              closeLabel="Fechar cadeia"
              onToggle={async (open) => {
                await admin.setChainOpen(c.chainId, open);
                chains.reload();
              }}
            />
          ))}
        </ul>
      )}

      <h2>Lojas</h2>
      {stores.data && <p className="count">{stores.data.total} lojas</p>}
      <State loading={stores.loading} error={stores.error} empty={storeItems.length === 0} emptyText="Sem lojas." />
      {storeItems.length > 0 && (
        <ul className="rows">
          {storeItems.map((s: CatalogStore) => (
            <OpenRow
              key={s.storeId}
              title={s.name}
              meta={`${chainName.get(s.chainId) ?? "Cadeia desconhecida"} · ${s.address}`}
              open={s.status === 0}
              closeLabel="Fechar loja"
              onToggle={async (open) => {
                await admin.setStoreOpen(s.storeId, open);
                stores.reload();
              }}
            />
          ))}
        </ul>
      )}
      {stores.data && <Pager page={stores.data.page} pageSize={stores.data.pageSize} total={stores.data.total} onPage={setPage} />}
    </>
  );
}

function OpenRow({
  title,
  meta,
  open,
  closeLabel,
  onToggle,
}: {
  title: string;
  meta?: string;
  open: boolean;
  closeLabel: string;
  onToggle: (open: boolean) => Promise<void>;
}) {
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{title}</strong>
        </div>
        {meta && <p className="row-meta">{meta}</p>}
      </div>
      <div className="row-state">
        <span className={`pill ${open ? "pill-good" : "pill-muted"}`}>{open ? "Aberta" : "Fechada"}</span>
      </div>
      <div className="row-actions">
        {open ? (
          <ConfirmAction label="Fechar" confirmLabel={closeLabel} tone="danger" onConfirm={() => onToggle(false)} />
        ) : (
          <ConfirmAction label="Reabrir" confirmLabel="Reabrir" onConfirm={() => onToggle(true)} />
        )}
      </div>
    </li>
  );
}

const PROMOTION_FILTERS = [
  { value: "Active", label: "Ativas" },
  { value: "Cancelled", label: "Canceladas" },
  { value: "", label: "Todas" },
] as const;

const PROMOTION_TYPE: Record<number, string> = { 0: "Desconto percentual", 1: "Desconto em valor", 2: "Leve X pague Y", 3: "Preço de pack" };

function PromotionsSection() {
  const [status, setStatus] = useState<string>("Active");
  const [page, setPage] = useState(1);
  const list = useLoad(() => admin.promotions(status, page), [status, page]);
  const items = list.data?.items ?? [];

  return (
    <>
      <div className="chip-row" role="group" aria-label="Estado da promoção">
        {PROMOTION_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className="chip"
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {list.data && <p className="count">{list.data.total} promoções</p>}
      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem promoções." />
      {items.length > 0 && (
        <ul className="rows">
          {items.map((p) => (
            <PromotionRow key={p.promotionId} promotion={p} onChanged={list.reload} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function PromotionRow({ promotion: p, onChanged }: { promotion: CatalogPromotion; onChanged: () => void }) {
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{p.description}</strong>
        </div>
        <p className="row-meta">
          {PROMOTION_TYPE[p.type] ?? "Promoção"}
          {p.discountPercent !== null && <> · {p.discountPercent}%</>}
          {" · "}
          {dateOnly.format(new Date(p.startsAt))} a {dateOnly.format(new Date(p.endsAt))}
          {p.requiresCard && " · com cartão"}
        </p>
      </div>
      <div className="row-state">
        <span className={`pill ${p.status === 0 ? "pill-good" : "pill-muted"}`}>{p.status === 0 ? "Ativa" : "Cancelada"}</span>
      </div>
      <div className="row-actions">
        {p.status === 0 && (
          <ConfirmAction
            label="Cancelar"
            confirmLabel="Cancelar promoção"
            tone="danger"
            onConfirm={async () => {
              await admin.cancelPromotion(p.promotionId);
              onChanged();
            }}
          />
        )}
      </div>
    </li>
  );
}
