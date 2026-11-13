import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getProduct, searchIngredients, searchProducts, type IngredientDto } from "../api/client";
import type { CallerHouseholdDto } from "../api/households";
import { addPantryItemsBatch, PantryLocation, pantryLocationLabels, pantryLocations } from "../api/pantry";
import { MeasurementUnit, measurementUnitLabels, type CategoryDto, type ChainDto, type ProductDto } from "../api/types";
import { describeError } from "../auth/errors";
import { aisleClass, aisleOf, topCategory } from "../catalog/aisles";
import { useCategories } from "../catalog/useCategories";
import { useActiveChains } from "../catalog/useChains";
import { HouseholdGate } from "../household/HouseholdGate";
import { isIsoDate } from "../plan/dates";

const units = Object.values(MeasurementUnit) as MeasurementUnit[];

/** Uma linha por acrescentar: um produto do catálogo, ou um ingrediente sem marca ("cebolas"). */
interface Draft {
  key: number;
  kind: "product" | "ingredient";
  id: string;
  name: string;
  detail: string;
  amount: string;
  unit: MeasurementUnit;
  location: PantryLocation;
  expiresAt: string;
  price: string;
  /** Cadeia onde foi comprado; "" = não dito. */
  chainId: string;
  /** Categoria do produto, para a cor do corredor; os ingredientes não têm. */
  category: CategoryDto | null;
}

let nextKey = 1;

function fromProduct(product: ProductDto, location: PantryLocation, chainId: string): Draft {
  return {
    key: nextKey++,
    kind: "product",
    id: product.productId,
    name: product.name,
    detail: [product.brand, `${product.packageQuantity} ${measurementUnitLabels[product.packageUnit]}`]
      .filter(Boolean)
      .join(" · "),
    // Por omissão, uma embalagem inteira.
    amount: String(product.packageQuantity),
    unit: product.packageUnit,
    location,
    expiresAt: "",
    price: "",
    chainId,
    category: product.category,
  };
}

function fromIngredient(ingredient: IngredientDto, location: PantryLocation, chainId: string): Draft {
  return {
    key: nextKey++,
    kind: "ingredient",
    id: ingredient.ingredientId,
    name: ingredient.displayName ?? ingredient.name,
    detail: "sem marca",
    amount: "1",
    unit: ingredient.defaultUnit,
    location,
    expiresAt: "",
    price: "",
    chainId,
    category: null,
  };
}

function aisleFor(category: CategoryDto | null, categories: Map<string, CategoryDto> | null): string {
  if (!category) return aisleClass(null);
  return aisleClass(aisleOf((topCategory(category, categories) ?? category).name));
}

export function AddPantryItemPage() {
  return <HouseholdGate>{(household) => <AddPantryItem household={household} />}</HouseholdGate>;
}

function AddPantryItem({ household }: { household: CallerHouseholdDto }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get("produto");

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [location, setLocation] = useState<PantryLocation>(PantryLocation.Pantry);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [chainId, setChainId] = useState("");
  const categories = useCategories();
  const chains = useActiveChains();

  useEffect(() => {
    if (productIdParam) {
      getProduct(productIdParam)
        .then((product) =>
          setDrafts((current) => (current.length === 0 ? [fromProduct(product, PantryLocation.Pantry, "")] : current)),
        )
        .catch(() => undefined);
    }
  }, [productIdParam]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setProducts([]);
      setIngredients([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchProducts(search.trim(), 1, 6)
        .then((result) => !cancelled && setProducts(result.items))
        .catch(() => undefined);
      searchIngredients(search.trim(), 6)
        .then((result) => !cancelled && setIngredients(result.items))
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  function add(draft: Draft) {
    setDrafts((current) => [...current, draft]);
    setSearch("");
    setProducts([]);
    setIngredients([]);
  }

  function update(key: number, patch: Partial<Draft>) {
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function applyChainToAll(next: string) {
    setChainId(next);
    setDrafts((current) => current.map((d) => ({ ...d, chainId: next })));
  }

  function applyLocationToAll(next: PantryLocation) {
    setLocation(next);
    setDrafts((current) => current.map((d) => ({ ...d, location: next })));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (drafts.length === 0) return;

    const items = [];
    for (const draft of drafts) {
      const amount = Number(draft.amount.replace(",", "."));
      const price = draft.price.trim() === "" ? null : Number(draft.price.replace(",", "."));
      if (!(amount > 0)) {
        setError(`Indica a quantidade de ${draft.name}.`);
        return;
      }
      if (draft.expiresAt !== "" && !isIsoDate(draft.expiresAt)) {
        setError(`A validade de ${draft.name} não é uma data válida.`);
        return;
      }
      if (price !== null && !(price >= 0)) {
        setError(`O preço de ${draft.name} não é válido.`);
        return;
      }
      items.push({
        productId: draft.kind === "product" ? draft.id : null,
        ingredientId: draft.kind === "ingredient" ? draft.id : null,
        quantity: { amount, unit: draft.unit },
        location: draft.location,
        expiresAt: draft.expiresAt === "" ? null : draft.expiresAt,
        purchasedPrice: price === null ? null : { amount: price, currency: "EUR" },
        chainId: draft.chainId === "" ? null : draft.chainId,
      });
    }

    setError(null);
    setSubmitting(true);
    try {
      await addPantryItemsBatch(household.householdId, items);
      const notice =
        items.length === 1
          ? `${drafts[0].name} adicionado à despensa.`
          : `${items.length} itens adicionados à despensa.`;
      navigate("/despensa", { state: { notice } });
    } catch (err) {
      setError(
        describeError(err, {
          "invalid-argument": "Algum item não pode ser adicionado (um produto pode ter sido descontinuado).",
        }),
      );
      setSubmitting(false);
    }
  }

  const searching = search.trim().length >= 2;
  const hasResults = products.length > 0 || ingredients.length > 0;

  return (
    <div className="page add-pantry-page">
      <nav className="crumb" aria-label="Caminho">
        <Link to="/despensa" className="back-link">
          Despensa
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>Adicionar à despensa</h1>
          <p className="page-head-sub">{household.name}</p>
        </div>
      </header>

      <div className="add-layout">
        <section className="add-picker" aria-label="Procurar">
          <div className="add-search">
            <div className="search-wrap">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                aria-label="Produto ou ingrediente"
                placeholder="Leite, cebola, arroz…"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearch("")}
              />
            </div>
            {searching && !hasResults && (
              <p className="add-search-empty muted">Nada encontrado para “{search.trim()}”.</p>
            )}
            {hasResults && (
              <ul className="product-results">
                {ingredients.length > 0 && <li className="result-group">Ingredientes sem marca</li>}
                {ingredients.map((ingredient) => (
                  <li key={ingredient.ingredientId}>
                    <button type="button" onClick={() => add(fromIngredient(ingredient, location, chainId))}>
                      <span className="result-text">
                        <strong>{ingredient.displayName ?? ingredient.name}</strong>
                        <span className="muted">Basta o nome, sem marca</span>
                      </span>
                    </button>
                  </li>
                ))}
                {products.length > 0 && <li className="result-group">Produtos do catálogo</li>}
                {products.map((product) => (
                  <li key={product.productId} className={aisleFor(product.category, categories)}>
                    <button type="button" onClick={() => add(fromProduct(product, location, chainId))}>
                      <span className="result-text">
                        <strong>{product.name}</strong>
                        <span className="muted">
                          {product.brand ? `${product.brand} · ` : ""}
                          {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="add-where">
            <span className="add-where-label" id="add-where-label">
              Guardar em
            </span>
            <div className="chip-row" role="group" aria-labelledby="add-where-label">
              {pantryLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className="chip"
                  aria-pressed={location === loc}
                  onClick={() => applyLocationToAll(loc)}
                >
                  {pantryLocationLabels[loc]}
                </button>
              ))}
            </div>
          </div>
          {chains && chains.length > 0 && (
            <label className="add-where">
              <span className="add-where-label">Comprado no</span>
              <ChainSelect chains={chains} value={chainId} onChange={applyChainToAll} label="Onde compraste" />
            </label>
          )}
          <p className="add-hint muted">
            Para “2 cebolas” serve o ingrediente; para uma marca em concreto, o produto. Junta vários e guarda tudo de
            uma vez.
          </p>
        </section>

        <section className="add-basket" aria-labelledby="add-basket-title">
          <h2 id="add-basket-title">
            Por guardar {drafts.length > 0 && <span className="muted">{drafts.length}</span>}
          </h2>
          {drafts.length === 0 ? (
            <p className="empty-state">Ainda nada. Pesquisa e escolhe o que trouxeste das compras.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <ul className="draft-list">
                {drafts.map((draft) => (
                  <DraftRow
                    key={draft.key}
                    draft={draft}
                    aisle={aisleFor(draft.category, categories)}
                    chains={chains}
                    onChange={(patch) => update(draft.key, patch)}
                    onRemove={() => setDrafts((current) => current.filter((d) => d.key !== draft.key))}
                  />
                ))}
              </ul>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="add-submit">
                <span className="muted">
                  {drafts.length === 1 ? "1 item por guardar" : `${drafts.length} itens por guardar`}
                </span>
                <button type="submit" className="button-primary" disabled={submitting}>
                  {submitting
                    ? "A guardar…"
                    : drafts.length === 1
                      ? "Guardar na despensa"
                      : `Guardar ${drafts.length} itens`}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function DraftRow({
  draft,
  aisle,
  chains,
  onChange,
  onRemove,
}: {
  draft: Draft;
  aisle: string;
  chains: ChainDto[] | null;
  onChange: (patch: Partial<Draft>) => void;
  onRemove: () => void;
}) {
  // Validade, preço e loja são opcionais: ficam fechados até serem precisos.
  const [more, setMore] = useState(false);

  return (
    <li className={`draft-row ${aisle}`}>
      <div className="pantry-main">
        <span className="meal-title">{draft.name}</span>
        <span className="meal-meta muted">{draft.detail}</span>
      </div>
      <div className="draft-controls">
        <span className="qty-field">
          <input
            type="text"
            inputMode="decimal"
            required
            aria-label={`Quantidade de ${draft.name}`}
            value={draft.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
          <select
            className="category-select"
            aria-label="Unidade"
            value={draft.unit}
            onChange={(e) => onChange({ unit: Number(e.target.value) as MeasurementUnit })}
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {measurementUnitLabels[u]}
              </option>
            ))}
          </select>
        </span>
        <select
          className="category-select"
          aria-label={`Onde fica ${draft.name}`}
          value={draft.location}
          onChange={(e) => onChange({ location: Number(e.target.value) as PantryLocation })}
        >
          {pantryLocations.map((loc) => (
            <option key={loc} value={loc}>
              {pantryLocationLabels[loc]}
            </option>
          ))}
        </select>
        <button type="button" className="row-action" aria-expanded={more} onClick={() => setMore(!more)}>
          Validade, preço e loja
        </button>
      </div>
      <button type="button" className="icon-danger" aria-label={`Tirar ${draft.name}`} title="Tirar" onClick={onRemove}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {more && (
        <div className="draft-more">
          <label className="form-field">
            <span>Validade</span>
            <input type="date" value={draft.expiresAt} onChange={(e) => onChange({ expiresAt: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Preço pago (€)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Opcional"
              value={draft.price}
              onChange={(e) => onChange({ price: e.target.value })}
            />
          </label>
          {chains && chains.length > 0 && (
            <label className="form-field">
              <span>Comprado no</span>
              <ChainSelect
                chains={chains}
                value={draft.chainId}
                onChange={(next) => onChange({ chainId: next })}
                label={`Onde compraste ${draft.name}`}
              />
            </label>
          )}
        </div>
      )}
    </li>
  );
}

function ChainSelect({
  chains,
  value,
  label,
  onChange,
}: {
  chains: ChainDto[];
  value: string;
  label: string;
  onChange: (chainId: string) => void;
}) {
  return (
    <select className="category-select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Sem loja</option>
      {chains.map((chain) => (
        <option key={chain.chainId} value={chain.chainId}>
          {chain.name}
        </option>
      ))}
    </select>
  );
}
