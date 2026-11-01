import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getProduct, searchIngredients, searchProducts, type IngredientDto } from "../api/client";
import type { CallerHouseholdDto } from "../api/households";
import { addPantryItemsBatch, PantryLocation, pantryLocationLabels, pantryLocations } from "../api/pantry";
import { MeasurementUnit, measurementUnitLabels, type ProductDto } from "../api/types";
import { describeError } from "../auth/errors";
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
}

let nextKey = 1;

function fromProduct(product: ProductDto, location: PantryLocation): Draft {
  return {
    key: nextKey++,
    kind: "product",
    id: product.productId,
    name: product.name,
    detail: [product.brand, `${product.packageQuantity} ${measurementUnitLabels[product.packageUnit]}`].filter(Boolean).join(" · "),
    // Por omissão, uma embalagem inteira.
    amount: String(product.packageQuantity),
    unit: product.packageUnit,
    location,
    expiresAt: "",
    price: "",
  };
}

function fromIngredient(ingredient: IngredientDto, location: PantryLocation): Draft {
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
  };
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

  useEffect(() => {
    if (productIdParam) {
      getProduct(productIdParam)
        .then((product) => setDrafts((current) => (current.length === 0 ? [fromProduct(product, PantryLocation.Pantry)] : current)))
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
      });
    }

    setError(null);
    setSubmitting(true);
    try {
      await addPantryItemsBatch(household.householdId, items);
      const notice = items.length === 1 ? `${drafts[0].name} adicionado à despensa.` : `${items.length} itens adicionados à despensa.`;
      navigate("/despensa", { state: { notice } });
    } catch (err) {
      setError(describeError(err, { "invalid-argument": "Algum item não pode ser adicionado (um produto pode ter sido descontinuado)." }));
      setSubmitting(false);
    }
  }

  const searching = search.trim().length >= 2;

  return (
    <div className="page auth-page">
      <Link to="/despensa" className="back-link">
        Despensa
      </Link>
      <h1>Adicionar à despensa</h1>
      <p className="page-sub">
        {household.name} · acrescenta quantos quiseres e guarda tudo de uma vez
      </p>

      <div className="form-field">
        <span>Produto ou ingrediente</span>
        <input
          type="search"
          className="product-search"
          placeholder="Pesquisar: leite, cebola, arroz…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searching && products.length === 0 && ingredients.length === 0 && <p className="muted">Nada encontrado para “{search.trim()}”.</p>}
        {(products.length > 0 || ingredients.length > 0) && (
          <ul className="product-results">
            {ingredients.length > 0 && <li className="result-group muted">Sem marca (basta o nome)</li>}
            {ingredients.map((ingredient) => (
              <li key={ingredient.ingredientId}>
                <button type="button" onClick={() => add(fromIngredient(ingredient, location))}>
                  <strong>{ingredient.displayName ?? ingredient.name}</strong>
                  <span className="muted">ingrediente, sem marca</span>
                </button>
              </li>
            ))}
            {products.length > 0 && <li className="result-group muted">Produtos do catálogo</li>}
            {products.map((product) => (
              <li key={product.productId}>
                <button type="button" onClick={() => add(fromProduct(product, location))}>
                  <strong>{product.name}</strong>
                  <span className="muted">
                    {product.brand ? `${product.brand} · ` : ""}
                    {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {drafts.length === 0 ? (
        <p className="empty-state">
          Pesquisa acima e escolhe. Para “2 cebolas” escolhe o ingrediente; para uma marca em concreto, o produto. Podes juntar vários antes de guardar.
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Onde ficam (para todos)</span>
            <select className="category-select" value={location} onChange={(e) => applyLocationToAll(Number(e.target.value) as PantryLocation)}>
              {pantryLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {pantryLocationLabels[loc]}
                </option>
              ))}
            </select>
          </label>

          <ul className="draft-list">
            {drafts.map((draft) => (
              <li key={draft.key} className="draft-card">
                <div className="draft-head">
                  <strong>{draft.name}</strong> <span className="muted">{draft.detail}</span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setDrafts((current) => current.filter((d) => d.key !== draft.key))}
                  >
                    Tirar
                  </button>
                </div>
                <div className="form-row">
                  <label className="form-field">
                    <span>Quantidade</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={draft.amount}
                      onChange={(e) => update(draft.key, { amount: e.target.value })}
                    />
                  </label>
                  <label className="form-field">
                    <span>Unidade</span>
                    <select
                      className="category-select"
                      value={draft.unit}
                      onChange={(e) => update(draft.key, { unit: Number(e.target.value) as MeasurementUnit })}
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {measurementUnitLabels[u]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <details className="draft-more">
                  <summary>Onde, validade e preço</summary>
                  <label className="form-field">
                    <span>Onde fica</span>
                    <select
                      className="category-select"
                      value={draft.location}
                      onChange={(e) => update(draft.key, { location: Number(e.target.value) as PantryLocation })}
                    >
                      {pantryLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {pantryLocationLabels[loc]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Validade (opcional)</span>
                    <input type="date" value={draft.expiresAt} onChange={(e) => update(draft.key, { expiresAt: e.target.value })} />
                  </label>
                  <label className="form-field">
                    <span>Preço pago em € (opcional)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(e) => update(draft.key, { price: e.target.value })}
                    />
                  </label>
                </details>
              </li>
            ))}
          </ul>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "A adicionar…" : drafts.length === 1 ? "Adicionar" : `Adicionar ${drafts.length} itens`}
          </button>
        </form>
      )}
    </div>
  );
}
