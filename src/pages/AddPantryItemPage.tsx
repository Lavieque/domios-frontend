import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getProduct, searchProducts } from "../api/client";
import type { CallerHouseholdDto } from "../api/households";
import { addPantryItem, PantryLocation, pantryLocationLabels, pantryLocations } from "../api/pantry";
import { MeasurementUnit, measurementUnitLabels, type ProductDto } from "../api/types";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { isIsoDate } from "../plan/dates";

const units = Object.values(MeasurementUnit) as MeasurementUnit[];

export function AddPantryItemPage() {
  return <HouseholdGate>{(household) => <AddPantryItem household={household} />}</HouseholdGate>;
}

function AddPantryItem({ household }: { household: CallerHouseholdDto }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get("produto");

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductDto[]>([]);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<MeasurementUnit>(MeasurementUnit.Unit);
  const [location, setLocation] = useState<PantryLocation>(PantryLocation.Pantry);
  const [expiresAt, setExpiresAt] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function choose(next: ProductDto) {
    setProduct(next);
    // Por omissão, uma embalagem inteira.
    setAmount(String(next.packageQuantity));
    setUnit(next.packageUnit);
    setResults([]);
  }

  useEffect(() => {
    if (productIdParam) getProduct(productIdParam).then(choose).catch(() => undefined);
  }, [productIdParam]);

  useEffect(() => {
    if (product || search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchProducts(search.trim(), 1, 8)
        .then((result) => !cancelled && setResults(result.items))
        .catch(() => undefined);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, product]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!product) return;
    const amountNumber = Number(amount.replace(",", "."));
    const priceNumber = price.trim() === "" ? null : Number(price.replace(",", "."));
    if (!(amountNumber > 0)) {
      setError("Indica a quantidade.");
      return;
    }
    if (expiresAt !== "" && !isIsoDate(expiresAt)) {
      setError("A validade não é uma data válida.");
      return;
    }
    if (priceNumber !== null && !(priceNumber >= 0)) {
      setError("O preço não é válido.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await addPantryItem(household.householdId, {
        productId: product.productId,
        quantity: { amount: amountNumber, unit },
        location,
        purchasedAt: new Date().toISOString(),
        expiresAt: expiresAt === "" ? null : expiresAt,
        purchasedPrice: priceNumber === null ? null : { amount: priceNumber, currency: "EUR" },
      });
      navigate("/despensa", { state: { notice: `${product.name} adicionado à despensa.` } });
    } catch (err) {
      setError(describeError(err, { "invalid-argument": "O produto não pode ser adicionado (pode ter sido descontinuado)." }));
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <Link to="/despensa" className="back-link">
        ← Despensa
      </Link>
      <p className="eyebrow">{household.name}</p>
      <h1>Adicionar à despensa</h1>

      {product ? (
        <p className="notice">
          <strong>{product.name}</strong>
          {product.brand && ` · ${product.brand}`} · {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}{" "}
          <button type="button" className="link-button" onClick={() => setProduct(null)}>
            Trocar
          </button>
        </p>
      ) : (
        <div className="form-field">
          <span>Produto</span>
          <input
            type="search"
            className="product-search"
            placeholder="Pesquisar no catálogo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="product-results">
              {results.map((result) => (
                <li key={result.productId}>
                  <button type="button" onClick={() => choose(result)}>
                    <strong>{result.name}</strong>
                    <span className="muted">
                      {result.brand ? `${result.brand} · ` : ""}
                      {result.packageQuantity} {measurementUnitLabels[result.packageUnit]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {product && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-field">
              <span>Quantidade</span>
              <input type="text" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="form-field">
              <span>Unidade</span>
              <select className="category-select" value={unit} onChange={(e) => setUnit(Number(e.target.value) as MeasurementUnit)}>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {measurementUnitLabels[u]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="form-field">
            <span>Onde fica</span>
            <select
              className="category-select"
              value={location}
              onChange={(e) => setLocation(Number(e.target.value) as PantryLocation)}
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
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Preço pago em € (opcional)</span>
            <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "A adicionar…" : "Adicionar"}
          </button>
        </form>
      )}
    </div>
  );
}
