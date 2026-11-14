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
  cookPlannedMeal,
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
import { MealPhoto } from "../components/MealPhoto";
import { PlanToPantryForm } from "../components/PlanToPantryForm";
import { SendToListForm } from "../components/SendToListForm";
import { HouseholdGate } from "../household/HouseholdGate";
import { useRecipeImages } from "../plan/recipeImages";
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today, weekDays, weekdayName, weekdayTitle } from "../plan/dates";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

export function PlanPage() {
  return <HouseholdGate>{(household) => <WeekPlan household={household} />}</HouseholdGate>;
}

const quantityFormat = numberFormat({ maximumFractionDigits: 1 });

/** O que falta e as sugestões começam curtos; o resto abre-se com um botão. */
const MISSING_SHOWN = 8;
const SUGGESTIONS_SHOWN = 3;
/** Pedem-se mais sugestões do que as que se mostram, para o "Ver mais". */
const SUGGESTIONS_FETCHED = 9;

const isSunday = (date: string) => new Date(`${date}T12:00:00`).getDay() === 0;

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
  const [allMissing, setAllMissing] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState(false);
  // Outra semana começa outra vez com as listas curtas.
  useEffect(() => {
    setAllMissing(false);
    setAllSuggestions(false);
  }, [monday]);
  // A foto de cada prato vem da receita: o plano só traz o id.
  const images = useRecipeImages(meals.map((meal) => meal.recipeId));

  const householdId = household.householdId;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listPlannedMeals(householdId, monday, sunday),
      getPlanAvailability(householdId, monday, sunday),
      // As sugestões são um extra: se falharem, o plano mostra-se na mesma.
      getSuggestions(householdId, suggestionDate, SUGGESTIONS_FETCHED).catch(() => null),
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
      setError(describeError(err, { "invalid-state-transition": tr().plan.locked }));
    }
  }

  const missingLines = availability?.lines.filter((line) => line.status !== AvailabilityLineStatus.Available) ?? [];
  const now = today();

  return (
    <div className="page week-page">
      <header className="week-head">
        <h1>{tr().plan.title}</h1>
        <p className="week-head-sub">{household.name}</p>
        <nav className="week-nav" aria-label={tr().plan.weeks}>
          <button type="button" className="week-step" onClick={() => goToWeek(addDays(monday, -7))}>
            <svg className="week-step-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {tr().plan.previous}
          </button>
          <span className="week-range">
            {shortDate(monday)} – {longDate(sunday)}
          </span>
          <button type="button" className="week-step" onClick={() => goToWeek(addDays(monday, 7))}>
            {tr().plan.next}
            <svg className="week-step-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link to="/ementas" className="week-nav-link">
            {tr().plan.applyTemplate}
          </Link>
        </nav>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted loading">{tr().common.loading}</p>}

      <div className="week-layout">
        {/* Os dias em linhas, por ordem; o número fica sempre na mesma coluna. */}
        <ol className="week-days" aria-label={tr().plan.days}>
          {days.map((day) => {
            const dayMeals = meals.filter((meal) => meal.date === day);
            const isToday = day === now;
            const classes = ["week-day", isToday && "is-today", day < now && "is-past"].filter(Boolean).join(" ");
            return (
              <li key={day} className={classes} aria-current={isToday ? "date" : undefined}>
                <div className="week-day-date">
                  <span className={isToday || isSunday(day) ? "week-day-number is-red" : "week-day-number"}>
                    {Number(day.slice(8, 10))}
                  </span>
                  <span className="week-day-weekday">
                    {weekdayTitle(day).replace("-feira", "")}
                    {isToday && <span className="week-day-today">{tr().plan.today}</span>}
                  </span>
                </div>
                {dayMeals.length === 0 ? (
                  <p className="week-day-empty">{tr().plan.nothingPlanned}</p>
                ) : (
                  <ul className="week-day-meals">
                    {dayMeals.map((meal) => (
                      <li
                        key={meal.plannedMealId}
                        className={meal.status === PlannedMealStatus.Skipped ? "week-meal has-photo is-skipped" : "week-meal has-photo"}
                      >
                        <MealPhoto src={meal.recipeId ? images.get(meal.recipeId) : null} />
                        <span className="week-meal-slot">{mealTypeLabels[meal.mealType]}</span>
                        <span className="week-meal-body">
                          {meal.recipeId ? (
                            <Link to={`/receitas/${meal.recipeId}`} className="week-meal-dish">
                              {meal.title}
                            </Link>
                          ) : (
                            <span className="week-meal-dish">{meal.title}</span>
                          )}
                          <span className="week-meal-meta">
                            {tr().plan.servings(meal.servings)}
                            {meal.status !== PlannedMealStatus.Planned && ` · ${plannedMealStatusLabels[meal.status]}`}
                          </span>
                        </span>
                        {meal.status !== PlannedMealStatus.Cooked && (
                          <span className="week-meal-actions">
                            {meal.status === PlannedMealStatus.Planned && meal.recipeId && day <= now && (
                              <CookButton meal={meal} onCook={(leftovers) => act(() => cookPlannedMeal(householdId, meal.plannedMealId, leftovers))} />
                            )}
                            {meal.status === PlannedMealStatus.Planned ? (
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => act(() => skipPlannedMeal(householdId, meal.plannedMealId))}
                              >
                                {tr().plan.skip}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => act(() => unskipPlannedMeal(householdId, meal.plannedMealId))}
                              >
                                {tr().plan.restore}
                              </button>
                            )}
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => act(() => deletePlannedMeal(householdId, meal.plannedMealId))}
                            >
                              {tr().common.remove}
                            </button>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>

        <aside className={allMissing || allSuggestions ? "week-side is-expanded" : "week-side"}>
          <section className="side-block">
            <div className="side-head">
              <h2>{tr().plan.missingTitle}</h2>
            </div>
            {availability && availability.plannedMealCount === 0 && (
              <p className="side-empty">{tr().plan.noRecipeMeals}</p>
            )}
            {availability && availability.plannedMealCount > 0 && missingLines.length === 0 && (
              <p className="side-ok">{tr().plan.haveAll}</p>
            )}
            {missingLines.length > 0 && (
              <ul className="missing-list">
                {(allMissing ? missingLines : missingLines.slice(0, MISSING_SHOWN)).map((line) => (
                  <li key={line.ingredientId}>
                    <span className="missing-name">{line.label}</span>
                    <span className="missing-qty">
                      {line.nominalQuantity
                        ? tr().plan.toTaste
                        : tr().plan.missing(`${quantityFormat.format(line.missing)} ${measurementUnitLabels[line.unit]}`) +
                          (line.status === AvailabilityLineStatus.Partial
                            ? tr().plan.youHave(quantityFormat.format(line.available))
                            : "")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {missingLines.length > MISSING_SHOWN && (
              <button
                type="button"
                className="link-button side-more"
                aria-expanded={allMissing}
                onClick={() => setAllMissing((open) => !open)}
              >
                {allMissing ? tr().plan.seeLess : tr().plan.seeAllMissing(missingLines.length)}
              </button>
            )}
            {missingLines.length > 0 && (
              <SendToListForm
                householdId={householdId}
                newListName={tr().plan.weekListName(shortDate(monday))}
                submitLabel={tr().ui.opportunities.putMissingOnList}
                send={async (listId) => {
                  const result = await addPlanToShoppingList(householdId, listId, monday, sunday);
                  return { list: result.shoppingList, added: result.addedItemCount, covered: result.coveredByListCount };
                }}
              />
            )}
            {missingLines.length > 0 && <PlanToPantryForm householdId={householdId} lines={missingLines} onDone={reload} />}
          </section>

          <section className="side-block">
            <div className="side-head">
              <h2>{tr().plan.suggestionsFor(weekdayName(suggestionDate))}</h2>
            </div>
            {suggestions && suggestions.suggestions.length === 0 && (
              <p className="side-empty">
                {tr().plan.noSuggestions}
              </p>
            )}
            <ul className="suggestion-list">
              {suggestions?.suggestions.slice(0, allSuggestions ? undefined : SUGGESTIONS_SHOWN).map((suggestion) => (
                <li key={suggestion.recipeId}>
                  <Link to={`/receitas/${suggestion.recipeId}`} className="suggestion-dish">
                    {suggestion.title}
                  </Link>
                  <p className={suggestion.missingIngredients.length === 0 ? "suggestion-meta is-ready" : "suggestion-meta"}>
                    {suggestion.missingIngredients.length === 0
                      ? tr().plan.haveAllShort
                      : tr().plan.ingredientsAtHome(suggestion.availableCount, suggestion.ingredientCount)}
                    {suggestion.reasons.length > 0 && (
                      <span className="suggestion-reasons">
                        {" · "}
                        {suggestion.reasons.map((reason) => suggestionReasonLabels[reason]).join(" · ")}
                      </span>
                    )}
                  </p>
                  {suggestion.missingIngredients.length > 0 && (
                    <p className="suggestion-note is-missing">
                      {tr().plan.missingList(suggestion.missingIngredients.map((i) => i.name).join(", "))}
                    </p>
                  )}
                  {suggestion.avoided && suggestion.avoided.avoidedBy.length > 0 && (
                    <p className="suggestion-note">
                      {suggestion.avoided.avoidedBy.some((a) => a.severity === "Avoid") ? tr().plan.avoid : tr().plan.limit}:{" "}
                      {suggestion.avoided.avoidedBy.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  {suggestion.restrictions === RestrictionResult.Unverifiable && (
                    <p className="suggestion-note">{tr().plan.unverifiable}</p>
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
            {suggestions && suggestions.suggestions.length > SUGGESTIONS_SHOWN && (
              <button
                type="button"
                className="link-button side-more"
                aria-expanded={allSuggestions}
                onClick={() => setAllSuggestions((open) => !open)}
              >
                {allSuggestions ? tr().plan.seeLess : tr().plan.moreSuggestions}
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/** "Cozinhei": regista a refeição e gasta a despensa; as doses que sobram voltam à despensa como "Sobras". */
function CookButton({ meal, onCook }: { meal: PlannedMealDto; onCook: (leftoverServings: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [leftovers, setLeftovers] = useState(0);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" className="link-button" onClick={() => setOpen(true)}>
        {tr().plan.cooked}
      </button>
    );
  }

  return (
    <form
      className="inline-form cook-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        await onCook(leftovers);
        setBusy(false);
        setOpen(false);
      }}
    >
      {meal.servings > 1 && (
        <label>
          <span className="muted">{tr().plan.leftovers}</span>{" "}
          <select className="category-select" value={leftovers} onChange={(e) => setLeftovers(Number(e.target.value))}>
            {Array.from({ length: meal.servings }, (_, n) => (
              <option key={n} value={n}>
                {tr().plan.leftoverOption(n)}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="button-primary" disabled={busy}>
        {busy ? tr().plan.logging : tr().plan.log}
      </button>
      <button type="button" className="link-button" onClick={() => setOpen(false)}>
        {tr().common.cancel}
      </button>
    </form>
  );
}
