import { useState, type FormEvent } from "react";
import type { MemberDto } from "../api/households";
import { createPlannedMeal, MealType, mealTypeLabels, mealTypes, type PlannedMealDto } from "../api/planning";
import { describeError } from "../auth/errors";
import { isIsoDate, type IsoDate } from "../plan/dates";
import { tr } from "../i18n";

interface Props {
  householdId: string;
  recipeId: string;
  defaultDate: IsoDate;
  defaultMealType?: MealType;
  /** Os membros da casa: escolhe-se quem come, todos marcados ao abrir. Sem eles, a refeição fica sem participantes. */
  members?: MemberDto[];
  onAdded: (plannedMeal: PlannedMealDto) => void;
}

/** Dia + refeição para pôr uma receita no plano (POST .../planned-meals). */
export function AddToPlanForm({ householdId, recipeId, defaultDate, defaultMealType = MealType.Dinner, members = [], onAdded }: Props) {
  const [date, setDate] = useState(defaultDate);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  // null: ainda ninguém mexeu, vale "todos" (os membros podem chegar depois do formulário).
  const [chosen, setChosen] = useState<string[] | null>(null);
  const participants = chosen ?? members.map((member) => member.memberId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isIsoDate(date)) {
      setError(tr().ui.addToPlan.pickDay);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      onAdded(await createPlannedMeal(householdId, { date, mealType, recipeId, participantMemberIds: participants }));
    } catch (err) {
      setError(describeError(err, { "forbidden-recipe-scope": tr().ui.addToPlan.forbidden }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input type="date" aria-label={tr().ui.addToPlan.day} required value={date} onChange={(e) => setDate(e.target.value)} />
      <select
        className="category-select"
        aria-label={tr().ui.addToPlan.meal}
        value={mealType}
        onChange={(e) => setMealType(Number(e.target.value) as MealType)}
      >
        {mealTypes.map((type) => (
          <option key={type} value={type}>
            {mealTypeLabels[type]}
          </option>
        ))}
      </select>
      {members.length > 1 && (
        <fieldset className="participants-fieldset">
          <legend className="visually-hidden">{tr().plan.whoEats}</legend>
          {members.map((member) => (
            <label key={member.memberId}>
              <input
                type="checkbox"
                checked={participants.includes(member.memberId)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked
                      ? [...participants, member.memberId]
                      : participants.filter((id) => id !== member.memberId),
                  )
                }
              />{" "}
              {member.name}
            </label>
          ))}
        </fieldset>
      )}
      <button type="submit" className="button-primary" disabled={submitting}>
        {submitting ? tr().ui.addToPlan.adding : tr().ui.addToPlan.add}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
