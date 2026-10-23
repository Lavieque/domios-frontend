import { useState, type FormEvent } from "react";
import { createPlannedMeal, MealType, mealTypeLabels, mealTypes, type PlannedMealDto } from "../api/planning";
import { describeError } from "../auth/errors";
import { isIsoDate, type IsoDate } from "../plan/dates";

interface Props {
  householdId: string;
  recipeId: string;
  defaultDate: IsoDate;
  defaultMealType?: MealType;
  onAdded: (plannedMeal: PlannedMealDto) => void;
}

/** Dia + refeição para pôr uma receita no plano (POST .../planned-meals). */
export function AddToPlanForm({ householdId, recipeId, defaultDate, defaultMealType = MealType.Dinner, onAdded }: Props) {
  const [date, setDate] = useState(defaultDate);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isIsoDate(date)) {
      setError("Escolhe um dia.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      onAdded(await createPlannedMeal(householdId, { date, mealType, recipeId }));
    } catch (err) {
      setError(describeError(err, { "forbidden-recipe-scope": "Esta receita não pode ser usada pela tua casa." }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input type="date" aria-label="Dia" required value={date} onChange={(e) => setDate(e.target.value)} />
      <select
        className="category-select"
        aria-label="Refeição"
        value={mealType}
        onChange={(e) => setMealType(Number(e.target.value) as MealType)}
      >
        {mealTypes.map((type) => (
          <option key={type} value={type}>
            {mealTypeLabels[type]}
          </option>
        ))}
      </select>
      <button type="submit" className="button-primary" disabled={submitting}>
        {submitting ? "A adicionar…" : "Adicionar ao plano"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
