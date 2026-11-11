import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRecipe } from "../api/client";
import type { PlannedMealDto } from "../api/planning";
import {
  addItemsFromRecipe,
  createShoppingList,
  getShoppingList,
  listShoppingLists,
  ShoppingListStatus,
} from "../api/shopping";
import { dishTypeLabels, mainProteinLabels, measurementUnitLabels, recipeDifficultyLabels, type RecipeDto } from "../api/types";
import { AddToPlanForm } from "../components/AddToPlanForm";
import { RecipeAvoidedNotice } from "../components/RecipeAvoidedNotice";
import { SaveRecipeButton } from "../components/SaveRecipeButton";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { useHouseholds } from "../household/useHouseholds";
import { longDate, startOfWeek, today } from "../plan/dates";

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www./, "");
  } catch {
    return "site de origem";
  }
}

/** "45 min", "1 h", "1 h 20 min". */
function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** O que se abre por baixo do cabeçalho: um formulário de cada vez. */
type Task = "plan" | null;

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current } = useHouseholds();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);
  const [added, setAdded] = useState<PlannedMealDto | null>(null);
  // "Pôr na lista de compras": um clique, o que falta na despensa vai para a lista aberta.
  const [listResult, setListResult] = useState<{ listId: string; name: string; added: number } | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [task, setTask] = useState<Task>(null);
  // Riscar ingredientes enquanto se cozinha; não sai deste ecrã.
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setRecipe(null);
    setError(null);
    setChecked(new Set());
    setListResult(null);
    setListError(null);
    getRecipe(id)
      .then((data) => active && setRecipe(data))
      .catch((err: unknown) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [id]);

  if (!id) return null;
  if (error)
    return (
      <div className="page recipe-page">
        <p className="form-error" role="alert">
          Não deu para abrir esta receita. {error}
        </p>
        <p className="empty-state">
          <Link to="/receitas">Voltar às receitas</Link>
        </p>
      </div>
    );
  if (!recipe) return <p className="muted loading">A carregar…</p>;

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
      const listId = target ? target.shoppingListId : (await createShoppingList(householdId, "Compras")).shoppingListId;
      const before = target ? (await getShoppingList(householdId, listId)).items.length : 0;
      const list = await addItemsFromRecipe(householdId, listId, recipe.recipeId, true);
      setListResult({ listId, name: list.name, added: list.items.length - before });
    } catch (err) {
      setListError(describeError(err, { "invalid-state-transition": "Essa lista já está fechada." }));
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
      <nav className="crumb" aria-label="Caminho">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          Voltar
        </button>
        <span aria-hidden="true">·</span>
        <Link to="/receitas">Receitas</Link>
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
              <dt>Tempo</dt>
              <dd>{duration(totalTime)}</dd>
            </div>
          )}
          {/* A Api manda 0 quando a fonte não separa os tempos: "0 min" não diz nada. */}
          {recipe.prepTimeMinutes !== null && recipe.prepTimeMinutes > 0 && totalTime !== recipe.prepTimeMinutes && (
            <div>
              <dt>Preparação</dt>
              <dd>{duration(recipe.prepTimeMinutes)}</dd>
            </div>
          )}
          {recipe.cookTimeMinutes !== null && recipe.cookTimeMinutes > 0 && totalTime !== recipe.cookTimeMinutes && (
            <div>
              <dt>Cozedura</dt>
              <dd>{duration(recipe.cookTimeMinutes)}</dd>
            </div>
          )}
          <div>
            <dt>Porções</dt>
            <dd>{recipe.servings}</dd>
          </div>
          <div>
            <dt>Dificuldade</dt>
            <dd>{recipeDifficultyLabels[recipe.difficulty]}</dd>
          </div>
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
              Adicionar ao plano
            </button>
            {current ? (
              <button type="button" className="button-secondary button-lg" onClick={sendMissingToList} disabled={listBusy}>
                {listBusy ? "A pôr na lista…" : "Pôr na lista de compras"}
              </button>
            ) : (
              <Link to="/casa/nova" className="button-secondary button-lg">
                Pôr na lista de compras
              </Link>
            )}
            {/* Sem casa não há onde guardar: o botão simplesmente não aparece. */}
            {current && <SaveRecipeButton householdId={current.householdId} recipeId={recipe.recipeId} />}
          </div>

          {listResult && (
            <p className="notice inline-notice" role="status">
              {listResult.added === 0
                ? `Nada a acrescentar a «${listResult.name}»: o que a receita pede já está em casa ou na lista.`
                : `${listResult.added} ${listResult.added === 1 ? "ingrediente que falta foi" : "ingredientes que faltam foram"} para «${listResult.name}».`}{" "}
              <Link to={`/listas/${listResult.listId}`}>Ver a lista</Link>
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
                  Receita original em {sourceHost(recipe.sourceUrl)}
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
              <h2>Adicionar ao plano</h2>
              <HouseholdGate
                withoutHousehold={
                  <p className="muted">
                    Para planear refeições, <Link to="/casa/nova">cria primeiro a tua casa</Link>.
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
                        Adicionada a {longDate(added.date)}.{" "}
                        <Link to={`/plano?semana=${startOfWeek(added.date)}`}>Ver o plano dessa semana</Link>
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
            <h2 id="recipe-ingredients-title">Ingredientes</h2>
            <span className="muted">
              {recipe.servings === 1 ? "1 porção" : `${recipe.servings} porções`}
            </span>
          </div>
          {ingredients.length === 0 ? (
            <p className="muted">Sem ingredientes registados.</p>
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
                        {ingredient.isOptional && <span className="muted"> (opcional)</span>}
                      </span>
                      {!ingredient.notes && (
                        <span className="qty">
                          {quantityFormat.format(ingredient.quantity.amount)} {measurementUnitLabels[ingredient.quantity.unit]}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {checked.size > 0 && (
            <button type="button" className="link-button" onClick={() => setChecked(new Set())}>
              Desmarcar todos
            </button>
          )}
        </section>

        <section className="panel recipe-method" aria-labelledby="recipe-method-title">
          <div className="recipe-section-head">
            <h2 id="recipe-method-title">Preparação</h2>
            {steps.length > 0 && <span className="muted">{steps.length === 1 ? "1 passo" : `${steps.length} passos`}</span>}
          </div>
          {steps.length === 0 ? (
            <p className="muted">Sem passos registados.</p>
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
