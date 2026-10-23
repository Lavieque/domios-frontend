import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import {
  AvailabilityLineStatus,
  deletePlannedMeal,
  getPlanAvailability,
  getSuggestions,
  listPlannedMeals,
  mealTypeLabels,
  PlannedMealStatus,
  plannedMealStatusLabels,
  RestrictionResult,
  skipPlannedMeal,
  suggestionReasonLabels,
  unskipPlannedMeal,
  type MealSuggestionsDto,
  type PlanAvailabilityDto,
  type PlannedMealDto,
} from "../api/planning";
import { measurementUnitLabels } from "../api/types";
import { describeError } from "../auth/errors";
import { addPlanToShoppingList } from "../api/shopping";
import { AddToPlanForm } from "../components/AddToPlanForm";
import { SendToListForm } from "../components/SendToListForm";
import { HouseholdGate } from "../household/HouseholdGate";
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today, weekDays, weekdayName, weekdayTitle } from "../plan/dates";

export function PlanPage() {
  return <HouseholdGate>{(household) => <WeekPlan household={household} />}</HouseholdGate>;
}

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });

function WeekPlan({ household }: { household: CallerHouseholdDto }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("semana");
  const monday = startOfWeek(isIsoDate(requested) ? requested : today());
  const sunday = addDays(monday, 6);
  const days = weekDays(monday);
  // Sugestões para hoje nesta semana; nas outras, para a segunda-feira.
  const suggestionDate = days.includes(today()) ? today() : monday;

  const [meals, setMeals] = useState<PlannedMealDto[]>([]);
  const [availability, setAvailability] = useState<PlanAvailabilityDto | null>(null);
  const [suggestions, setSuggestions] = useState<MealSuggestionsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  const householdId = household.householdId;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listPlannedMeals(householdId, monday, sunday),
      getPlanAvailability(householdId, monday, sunday),
      // As sugestões são um extra: se falharem, o plano mostra-se na mesma.
      getSuggestions(householdId, suggestionDate).catch(() => null),
    ])
      .then(([plannedMeals, planAvailability, mealSuggestions]) => {
        if (cancelled) return;
        setMeals(plannedMeals);
        setAvailability(planAvailability);
        setSuggestions(mealSuggestions);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(describeError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [householdId, monday, sunday, suggestionDate, version]);

  function goToWeek(date: string) {
    setSearchParams(date === startOfWeek(today()) ? {} : { semana: date }, { replace: true });
  }

  async function act(action: () => Promise<unknown>) {
    try {
      await action();
      reload();
    } catch (err) {
      setError(describeError(err, { "invalid-state-transition": "Esta refeição já não pode ser alterada." }));
    }
  }

  const missingLines = availability?.lines.filter((line) => line.status !== AvailabilityLineStatus.Available) ?? [];

  return (
    <div className="page">
      <p className="eyebrow">{household.name}</p>
      <h1>Plano da semana</h1>
      <div className="week-nav">
        <button type="button" className="button-secondary" onClick={() => goToWeek(addDays(monday, -7))}>
          ← Anterior
        </button>
        <span className="week-range">
          {shortDate(monday)} – {longDate(sunday)}
        </span>
        <button type="button" className="button-secondary" onClick={() => goToWeek(addDays(monday, 7))}>
          Seguinte →
        </button>
        <Link to="/ementas" className="week-nav-link">
          Aplicar uma ementa pronta
        </Link>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted loading">A carregar…</p>}

      <div className="week-grid">
        {days.map((day) => {
          const dayMeals = meals.filter((meal) => meal.date === day);
          return (
            <section key={day} className={`day-card${day === today() ? " is-today" : ""}`}>
              <h2 className="day-title">
                <span>{weekdayTitle(day)}</span>
                <span className="muted">{shortDate(day)}</span>
              </h2>
              {dayMeals.length === 0 ? (
                <p className="muted day-empty">Nada planeado.</p>
              ) : (
                <ul className="day-meals">
                  {dayMeals.map((meal) => (
                    <li key={meal.plannedMealId} className={meal.status === PlannedMealStatus.Skipped ? "is-skipped" : ""}>
                      <span className="meal-type">{mealTypeLabels[meal.mealType]}</span>
                      {meal.recipeId ? (
                        <Link to={`/receitas/${meal.recipeId}`} className="meal-title">
                          {meal.title}
                        </Link>
                      ) : (
                        <span className="meal-title">{meal.title}</span>
                      )}
                      <span className="meal-meta muted">
                        {meal.servings} {meal.servings === 1 ? "dose" : "doses"}
                        {meal.status !== PlannedMealStatus.Planned && ` · ${plannedMealStatusLabels[meal.status]}`}
                      </span>
                      {meal.status !== PlannedMealStatus.Cooked && (
                        <span className="meal-actions">
                          {meal.status === PlannedMealStatus.Planned ? (
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => act(() => skipPlannedMeal(householdId, meal.plannedMealId))}
                            >
                              Saltar
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => act(() => unskipPlannedMeal(householdId, meal.plannedMealId))}
                            >
                              Repor
                            </button>
                          )}
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => act(() => deletePlannedMeal(householdId, meal.plannedMealId))}
                          >
                            Remover
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="plan-panels">
        <section className="panel">
          <h2>O que falta na despensa</h2>
          {availability && availability.plannedMealCount === 0 && (
            <p className="muted">Sem refeições com receita nesta semana.</p>
          )}
          {availability && availability.plannedMealCount > 0 && missingLines.length === 0 && (
            <p className="muted">Tens tudo o que as receitas desta semana pedem.</p>
          )}
          {missingLines.length > 0 && (
            <ul className="ingredient-list">
              {missingLines.map((line) => (
                <li key={line.ingredientId}>
                  <strong>{line.label}</strong>{" "}
                  <span className="muted">
                    {line.nominalQuantity
                      ? "q.b."
                      : `faltam ${quantityFormat.format(line.missing)} ${measurementUnitLabels[line.unit]}` +
                        (line.status === AvailabilityLineStatus.Partial
                          ? ` (tens ${quantityFormat.format(line.available)})`
                          : "")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {missingLines.length > 0 && (
            <SendToListForm
              householdId={householdId}
              newListName={`Compras da semana de ${shortDate(monday)}`}
              submitLabel="Pôr o que falta na lista"
              send={async (listId) => {
                const result = await addPlanToShoppingList(householdId, listId, monday, sunday);
                return { list: result.shoppingList, added: result.addedItemCount };
              }}
            />
          )}
        </section>

        <section className="panel">
          <h2>Sugestões para {weekdayName(suggestionDate)}</h2>
          {suggestions && suggestions.suggestions.length === 0 && (
            <p className="muted">
              Sem sugestões: as sugestões partem do que tens na despensa, e não há nada lá (ou nada que entre numa
              receita).
            </p>
          )}
          <ul className="suggestion-list">
            {suggestions?.suggestions.map((suggestion) => (
              <li key={suggestion.recipeId}>
                <Link to={`/receitas/${suggestion.recipeId}`} className="meal-title">
                  {suggestion.title}
                </Link>
                <div className="recipe-card-pills">
                  <span className="pill pill-accent2">
                    {suggestion.availableCount}/{suggestion.ingredientCount} ingredientes
                  </span>
                  {suggestion.reasons.map((reason) => (
                    <span key={reason} className="pill pill-muted">
                      {suggestionReasonLabels[reason]}
                    </span>
                  ))}
                </div>
                {suggestion.missingIngredients.length > 0 && (
                  <p className="muted suggestion-missing">
                    Falta: {suggestion.missingIngredients.map((i) => i.name).join(", ")}
                  </p>
                )}
                {suggestion.restrictions === RestrictionResult.Unverifiable && (
                  <p className="muted suggestion-missing">
                    Não deu para confirmar as restrições alimentares de todos os membros.
                  </p>
                )}
                <AddToPlanForm
                  householdId={householdId}
                  recipeId={suggestion.recipeId}
                  defaultDate={suggestionDate}
                  onAdded={reload}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
