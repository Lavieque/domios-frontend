import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { addPantryItemsBatch, PantryLocation, pantryLocationLabels, pantryLocations } from "../api/pantry";
import type { PlanAvailabilityLineDto } from "../api/planning";
import { measurementUnitLabels } from "../api/types";
import { describeError } from "../auth/errors";

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });

interface Props {
  householdId: string;
  /** As linhas que faltam; as "q.b." não entram, não têm quantidade. */
  lines: PlanAvailabilityLineDto[];
  onDone: () => void;
}

/**
 * "Já tenho estes": o que o plano diz que falta, mas que afinal está em casa, entra na despensa
 * sem passar pela lista de compras. O que se desmarca fica de fora.
 */
export function PlanToPantryForm({ householdId, lines, onDone }: Props) {
  const usable = lines.filter((line) => !line.nominalQuantity && line.missing > 0);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState<PantryLocation>(PantryLocation.Pantry);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  if (usable.length === 0) return null;
  const chosen = usable.filter((line) => !skipped.has(line.ingredientId));

  function toggle(ingredientId: string) {
    setSkipped((current) => {
      const next = new Set(current);
      if (!next.delete(ingredientId)) next.add(ingredientId);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (chosen.length === 0) return;
    setError(null);
    setDone(null);
    setSubmitting(true);
    try {
      await addPantryItemsBatch(
        householdId,
        chosen.map((line) => ({
          productId: null,
          ingredientId: line.ingredientId,
          quantity: { amount: line.missing, unit: line.unit },
          location,
          expiresAt: null,
          purchasedPrice: null,
        })),
      );
      setDone(chosen.length);
      onDone();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <details className="have-it-already">
      <summary>Já tenho alguns destes</summary>
      <form onSubmit={handleSubmit}>
        <p className="muted">Marca o que já está em casa. Entra na despensa com a quantidade que falta, e deixa de aparecer aqui.</p>
        <ul className="ingredient-list">
          {usable.map((line) => (
            <li key={line.ingredientId}>
              <label className="item-check">
                <input type="checkbox" checked={!skipped.has(line.ingredientId)} onChange={() => toggle(line.ingredientId)} />
                <span>
                  <strong>{line.label}</strong>{" "}
                  <span className="muted">
                    {quantityFormat.format(line.missing)} {measurementUnitLabels[line.unit]}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="inline-form">
          <select className="category-select" aria-label="Onde ficam" value={location} onChange={(e) => setLocation(Number(e.target.value) as PantryLocation)}>
            {pantryLocations.map((loc) => (
              <option key={loc} value={loc}>
                {pantryLocationLabels[loc]}
              </option>
            ))}
          </select>
          <button type="submit" className="button-secondary" disabled={submitting || chosen.length === 0}>
            {submitting ? "A guardar…" : `Pôr ${chosen.length} na despensa`}
          </button>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {done !== null && (
          <p className="notice inline-notice">
            {done === 1 ? "1 item entrou" : `${done} itens entraram`} na <Link to="/despensa">despensa</Link>.
          </p>
        )}
      </form>
    </details>
  );
}
