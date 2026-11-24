import { Busy } from "../components/Busy";
import { PageSkeleton } from "../components/PageSkeleton";
import { useState } from "react";
import { useLoad } from "../useLoad";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRecipe, getRecipeCost } from "../api/client";
import type { PlannedMealDto } from "../api/planning";
import {
  addItemsFromRecipe,
  createShoppingList,
  getShoppingList,
  listShoppingLists,
  ShoppingListStatus,
} from "../api/shopping";
import {
  dishTypeLabels,
  mainProteinLabels,
  measurementUnitLabels,
  recipeDifficultyLabels,
  type RecipeCostLineDto,
  type RecipeCostMissing,
} from "../api/types";
import { AddToPlanForm } from "../components/AddToPlanForm";
import { RecipeAvoidedNotice } from "../components/RecipeAvoidedNotice";
import { SaveRecipeButton } from "../components/SaveRecipeButton";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { useHouseholds } from "../household/useHouseholds";
import { longDate, startOfWeek, today } from "../plan/dates";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const quantityFormat = numberFormat({ maximumFractionDigits: 2 });
const money = numberFormat({ style: "currency", currency: "EUR" });

function missingLabel(missing: RecipeCostMissing): string {
  const t = tr().recipes;
  return missing === "NoProduct" ? t.missingNoProduct : missing === "NoConversion" ? t.missingNoConversion : t.missingNoPrice;
}

/** O custo de um ingrediente e o produto por onde se calculou; sem preço, a razão. */
function IngredientCost({ line }: { line: RecipeCostLineDto | undefined }) {
  if (!line || (line.cost === null && line.missing === null)) return null;
  const text = line.cost !== null ? tr().recipes.ingredientCost(money.format(line.cost)) : missingLabel(line.missing!);
  return line.productId ? (
    <Link
      to={`/produtos/${line.productId}`}
      className={line.cost !== null ? "ingredient-cost" : "ingredient-cost is-missing"}
      title={line.productName ?? undefined}
      aria-label={tr().recipes.seeProduct(line.productName ?? "")}
    >
      {text}
    </Link>
  ) : (
    <span className="ingredient-cost is-missing">{text}</span>
  );
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www./, "");
  } catch {
    return tr().recipe.sourceSite;
  }
}

/** "45 min", "1 h", "1 h 20 min". */
function duration(minutes: number): string {
  const t = tr().recipe;
  if (minutes < 60) return t.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? t.hours(hours) : t.hoursMinutes(hours, rest);
}

/** O que se abre por baixo do cabeçalho: um formulário de cada vez. */
type Task = "plan" | null;

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  // Outra receita é outro ecrã: os ingredientes riscados e os formulários abertos não passam para ela.
  return <RecipeDetail key={id} id={id} />;
}

function RecipeDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { current } = useHouseholds();
  const { data: recipe, error } = useLoad([id], () => getRecipe(id));
  // O preço é um extra: se falhar, a receita mostra-se na mesma.
  const cost = useLoad([id, "cost"], () => getRecipeCost(id).catch(() => null)).data ?? null;
  const costByLine = new Map((cost?.lines ?? []).map((line) => [line.recipeIngredientId, line] as const));
  const [added, setAdded] = useState<PlannedMealDto | null>(null);
  // "Pôr na lista de compras": um clique, o que falta na despensa vai para a lista aberta.
  const [listResult, setListResult] = useState<{ listId: string; name: string; added: number } | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [task, setTask] = useState<Task>(null);
  // Riscar ingredientes enquanto se cozinha; não sai deste ecrã.
  const [checked, setChecked] = useState<Set<string>>(() => new Set());

  if (error)
    return (
      <div className="page recipe-page">
        <p className="form-error" role="alert">
          {tr().recipe.openFailed} {error}
        </p>
        <p className="empty-state">
          <Link to="/receitas">{tr().recipe.backToRecipes}</Link>
        </p>
      </div>
    );
  if (!recipe) return <PageSkeleton />;

  const ingredients = recipe.ingredients.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const steps = recipe.steps.slice().sort((a, b) => a.stepNumber - b.stepNumber);
  const times = [recipe.prepTimeMinutes, recipe.cookTimeMinutes].filter((m): m is number => m !== null);
  const totalTime = times.length > 0 ? times.reduce((sum, m) => sum + m, 0) : null;
  const meta = [
    recipe.dishType !== null ? dishTypeLabels[recipe.dishType] : null,
    recipe.mainProtein !== null ? mainProteinLabels[recipe.mainProtein] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function toggleTask(next: Exclude<Task, null>) {
    setTask((current) => (current === next ? null : next));
  }

  /**
   * Acrescenta logo à primeira lista aberta os ingredientes que a despensa não cobre;
   * sem lista aberta, cria uma. Sem formulário pelo meio.
   */
  async function sendMissingToList() {
    if (!current || !recipe) return;
    setListBusy(true);
    setListError(null);
    setListResult(null);
    try {
      const householdId = current.householdId;
      const open = await listShoppingLists(householdId, ShoppingListStatus.Open, 1, 1);
      const target = open.items[0] ?? null;
      const listId = target ? target.shoppingListId : (await createShoppingList(householdId, tr().recipe.defaultListName)).shoppingListId;
      const before = target ? (await getShoppingList(householdId, listId)).items.length : 0;
      const list = await addItemsFromRecipe(householdId, listId, recipe.recipeId, true);
      setListResult({ listId, name: list.name, added: list.items.length - before });
    } catch (err) {
      setListError(describeError(err, { "invalid-state-transition": tr().ui.sendToList.listClosed }));
    } finally {
      setListBusy(false);
    }
  }

  function toggleIngredient(ingredientId: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  return (
    <div className="page recipe-page">
      <nav className="crumb" aria-label={tr().common.breadcrumb}>
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          {tr().recipe.back}
        </button>
        <span aria-hidden="true">·</span>
        <Link to="/receitas">{tr().recipe.recipes}</Link>
        {recipe.dishType !== null && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/receitas?prato=${recipe.dishType}`}>{dishTypeLabels[recipe.dishType]}</Link>
          </>
        )}
      </nav>

      {/* A receita como uma folha: os números numa coluna fixa, o prato à direita da régua. */}
      <article className="recipe-sheet" aria-labelledby="recipe-title">
        <dl className="recipe-facts">
          {totalTime !== null && (
            <div>
              <dt>{tr().recipe.time}</dt>
              <dd>{duration(totalTime)}</dd>
            </div>
          )}
          {/* A Api manda 0 quando a fonte não separa os tempos: "0 min" não diz nada. */}
          {recipe.prepTimeMinutes !== null && recipe.prepTimeMinutes > 0 && totalTime !== recipe.prepTimeMinutes && (
            <div>
              <dt>{tr().recipe.prep}</dt>
              <dd>{duration(recipe.prepTimeMinutes)}</dd>
            </div>
          )}
          {recipe.cookTimeMinutes !== null && recipe.cookTimeMinutes > 0 && totalTime !== recipe.cookTimeMinutes && (
            <div>
              <dt>{tr().recipe.cook}</dt>
              <dd>{duration(recipe.cookTimeMinutes)}</dd>
            </div>
          )}
          <div>
            <dt>{tr().recipe.servings}</dt>
            <dd>{recipe.servings}</dd>
          </div>
          <div>
            <dt>{tr().recipe.difficulty}</dt>
            <dd>{recipeDifficultyLabels[recipe.difficulty]}</dd>
          </div>
          {cost && cost.pricedIngredientCount > 0 && (
            <div>
              <dt>{tr().recipes.expectedPrice}</dt>
              <dd>{tr().recipes.perServing(money.format(cost.perServing))}</dd>
            </div>
          )}
        </dl>

        <div className="recipe-sheet-body">
          <h1 id="recipe-title" className="dish-name">
            {recipe.title}
          </h1>
          {meta && <p className="dish-meta">{meta}</p>}
          {recipe.description && <p className="recipe-lede">{recipe.description}</p>}

          {recipe.imageUrl && (
            <figure className="dish-photo">
              <img src={recipe.imageUrl} alt="" />
            </figure>
          )}

          <div className="day-actions recipe-actions">
            <button
              type="button"
              className="button-primary button-lg"
              aria-expanded={task === "plan"}
              aria-controls="recipe-task"
              onClick={() => toggleTask("plan")}
            >
              {tr().recipe.addToPlan}
            </button>
            {current ? (
              <button type="button" className="button-secondary button-lg" onClick={sendMissingToList} disabled={listBusy}>
                {listBusy ? <Busy>{tr().recipe.sending}</Busy> : tr().recipe.sendToList}
              </button>
            ) : (
              <Link to="/casa/nova" className="button-secondary button-lg">
                {tr().recipe.sendToList}
              </Link>
            )}
            {/* Sem casa não há onde guardar: o botão simplesmente não aparece. */}
            {current && <SaveRecipeButton householdId={current.householdId} recipeId={recipe.recipeId} />}
          </div>

          {listResult && (
            <p className="notice inline-notice" role="status">
              {listResult.added === 0
                ? tr().recipe.nothingToAdd(listResult.name)
                : tr().recipe.added(listResult.added, listResult.name)}{" "}
              <Link to={`/listas/${listResult.listId}`}>{tr().ui.sendToList.seeList}</Link>
            </p>
          )}
          {listError && (
            <p className="form-error" role="alert">
              {listError}
            </p>
          )}

          {(recipe.tags.length > 0 || recipe.sourceUrl) && (
            <p className="recipe-source">
              {recipe.tags.length > 0 && <span className="recipe-tags">{recipe.tags.join(", ")}</span>}
              {recipe.sourceUrl && (
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                  {tr().recipe.original(sourceHost(recipe.sourceUrl))}
                </a>
              )}
            </p>
          )}
        </div>
      </article>

      {/* Sem casa não há membros: o aviso simplesmente não aparece. */}
      <RecipeAvoidedNotice recipeId={recipe.recipeId} />

      {task !== null && (
        <section id="recipe-task" className="panel recipe-task">
          {task === "plan" ? (
            <>
              <h2>{tr().recipe.addToPlan}</h2>
              <HouseholdGate
                withoutHousehold={
                  <p className="muted">
                    {tr().recipe.needHousehold.before} <Link to="/casa/nova">{tr().recipe.needHousehold.link}</Link>
                    {tr().recipe.needHousehold.after}
                  </p>
                }
              >
                {(household) => (
                  <>
                    <AddToPlanForm
                      householdId={household.householdId}
                      recipeId={recipe.recipeId}
                      defaultDate={today()}
                      onAdded={setAdded}
                    />
                    {added && (
                      <p className="notice">
                        {tr().recipe.addedOn(longDate(added.date))}{" "}
                        <Link to={`/plano?semana=${startOfWeek(added.date)}`}>{tr().recipe.seeWeek}</Link>
                      </p>
                    )}
                  </>
                )}
              </HouseholdGate>
            </>
          ) : null}
        </section>
      )}

      <div className="recipe-body">
        <section className="panel recipe-ingredients" aria-labelledby="recipe-ingredients-title">
          <div className="recipe-section-head">
            <h2 id="recipe-ingredients-title">{tr().recipe.ingredients}</h2>
            <span className="muted">
              {tr().recipe.portions(recipe.servings)}
            </span>
          </div>
          {ingredients.length === 0 ? (
            <p className="muted">{tr().recipe.noIngredients}</p>
          ) : (
            <ul className="ingredient-checklist">
              {ingredients.map((ingredient) => {
                const done = checked.has(ingredient.recipeIngredientId);
                return (
                  <li key={ingredient.recipeIngredientId} className={done ? "is-done" : undefined}>
                    <label>
                      <input type="checkbox" checked={done} onChange={() => toggleIngredient(ingredient.recipeIngredientId)} />
                      {/* notes é a linha original da receita, quando a Api a guardou: substitui o resto. */}
                      <span className="ingredient-name">
                        {ingredient.notes ?? ingredient.ingredientName}
                        {ingredient.isOptional && <span className="muted">{tr().recipe.optional}</span>}
                      </span>
                      {!ingredient.notes && (
                        <span className="qty">
                          {quantityFormat.format(ingredient.quantity.amount)} {measurementUnitLabels[ingredient.quantity.unit]}
                        </span>
                      )}
                    </label>
                    <IngredientCost line={costByLine.get(ingredient.recipeIngredientId)} />
                  </li>
                );
              })}
            </ul>
          )}
          {checked.size > 0 && (
            <button type="button" className="link-button" onClick={() => setChecked(new Set())}>
              {tr().recipe.uncheckAll}
            </button>
          )}
          {cost && cost.ingredientCount > 0 && (
            <p className="recipe-cost-note muted">
              {cost.pricedIngredientCount === 0 ? (
                tr().recipes.noPrice
              ) : (
                <>
                  <strong>{tr().recipes.expectedTotal(money.format(cost.total), cost.servings)}</strong>
                  {cost.pricedIngredientCount < cost.ingredientCount &&
                    ` · ${tr().recipes.pricedOf(cost.pricedIngredientCount, cost.ingredientCount)}`}
                  {". "}
                  {tr().recipes.priceHint}
                </>
              )}
            </p>
          )}
        </section>

        <section className="panel recipe-method" aria-labelledby="recipe-method-title">
          <div className="recipe-section-head">
            <h2 id="recipe-method-title">{tr().recipe.method}</h2>
            {steps.length > 0 && <span className="muted">{tr().recipe.steps(steps.length)}</span>}
          </div>
          {steps.length === 0 ? (
            <p className="muted">{tr().recipe.noSteps}</p>
          ) : (
            <ol className="step-list">
              {steps.map((step) => (
                <li key={step.recipeStepId}>
                  <div>
                    <p className="step-text">{step.instruction}</p>
                    {step.durationMinutes !== null && (
                      <span className="step-minutes">
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <circle cx="8" cy="8" r="6.25" />
                          <path d="M8 4.75V8l2.25 1.5" />
                        </svg>
                        {duration(step.durationMinutes)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
