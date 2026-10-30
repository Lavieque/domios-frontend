import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRecipe } from "../api/client";
import type { PlannedMealDto } from "../api/planning";
import { addItemsFromRecipe, getShoppingList } from "../api/shopping";
import { dishTypeLabels, mainProteinLabels, measurementUnitLabels, recipeDifficultyLabels, type RecipeDto } from "../api/types";
import { AddToPlanForm } from "../components/AddToPlanForm";
import { SendToListForm } from "../components/SendToListForm";
import { HouseholdGate } from "../household/HouseholdGate";
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
type Task = "plan" | "list" | null;

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);
  const [added, setAdded] = useState<PlannedMealDto | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [task, setTask] = useState<Task>(null);
  // Riscar ingredientes enquanto se cozinha; não sai deste ecrã.
  const [checked, setChecked] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!id) return;
    setRecipe(null);
    setChecked(new Set());
    getRecipe(id).then(setRecipe);
  }, [id]);

  if (!id) return null;
  if (!recipe) return <p className="muted loading">A carregar…</p>;

  const ingredients = recipe.ingredients.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const steps = recipe.steps.slice().sort((a, b) => a.stepNumber - b.stepNumber);
  const times = [recipe.prepTimeMinutes, recipe.cookTimeMinutes].filter((m): m is number => m !== null);
  const totalTime = times.length > 0 ? times.reduce((sum, m) => sum + m, 0) : null;

  function toggleTask(next: Exclude<Task, null>) {
    setTask((current) => (current === next ? null : next));
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
    <div className="page">
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

      <section className={`recipe-hero${recipe.imageUrl ? " has-photo" : ""}`}>
        {recipe.imageUrl && (
          <div className="recipe-hero-photo">
            <img src={recipe.imageUrl} alt={recipe.title} />
          </div>
        )}

        <div className="recipe-hero-info">
          <h1>{recipe.title}</h1>
          {recipe.description && <p className="recipe-lede">{recipe.description}</p>}

          <ul className="recipe-facts">
            {totalTime !== null && (
              <li>
                <span>Tempo total</span>
                <strong>{duration(totalTime)}</strong>
              </li>
            )}
            {recipe.prepTimeMinutes !== null && totalTime !== recipe.prepTimeMinutes && (
              <li>
                <span>Preparação</span>
                <strong>{duration(recipe.prepTimeMinutes)}</strong>
              </li>
            )}
            {recipe.cookTimeMinutes !== null && totalTime !== recipe.cookTimeMinutes && (
              <li>
                <span>Cozedura</span>
                <strong>{duration(recipe.cookTimeMinutes)}</strong>
              </li>
            )}
            <li>
              <span>Porções</span>
              <strong>{recipe.servings}</strong>
            </li>
            <li>
              <span>Dificuldade</span>
              <strong>{recipeDifficultyLabels[recipe.difficulty]}</strong>
            </li>
          </ul>

          {(recipe.mainProtein !== null || recipe.tags.length > 0) && (
            <div className="recipe-tags">
              {recipe.mainProtein !== null && <span className="pill pill-accent2">{mainProteinLabels[recipe.mainProtein]}</span>}
              {recipe.tags.map((tag) => (
                <span key={tag} className="pill pill-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="article-actions">
            <button
              type="button"
              className="button-primary"
              aria-expanded={task === "plan"}
              aria-controls="recipe-task"
              onClick={() => toggleTask("plan")}
            >
              Adicionar ao plano
            </button>
            <button
              type="button"
              className="button-secondary"
              aria-expanded={task === "list"}
              aria-controls="recipe-task"
              onClick={() => toggleTask("list")}
            >
              Pôr na lista de compras
            </button>
          </div>

          {recipe.sourceUrl && (
            <p className="recipe-source">
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                Receita original em {sourceHost(recipe.sourceUrl)}
              </a>
            </p>
          )}
        </div>
      </section>

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
          ) : (
            <>
              <h2>Pôr na lista de compras</h2>
              <HouseholdGate
                withoutHousehold={
                  <p className="muted">
                    Para ter listas de compras, <Link to="/casa/nova">cria primeiro a tua casa</Link>.
                  </p>
                }
              >
                {(household) => (
                  <SendToListForm
                    householdId={household.householdId}
                    newListName={recipe.title}
                    submitLabel="Acrescentar ingredientes"
                    send={async (listId) => {
                      const before = await getShoppingList(household.householdId, listId);
                      const list = await addItemsFromRecipe(household.householdId, listId, recipe.recipeId, onlyMissing);
                      return { list, added: list.items.length - before.items.length };
                    }}
                  >
                    <label className="checkbox-field">
                      <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
                      Só o que não há na despensa
                    </label>
                  </SendToListForm>
                )}
              </HouseholdGate>
            </>
          )}
        </section>
      )}

      <div className="recipe-body">
        <section className="recipe-ingredients" aria-labelledby="recipe-ingredients-title">
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

        <section className="recipe-method" aria-labelledby="recipe-method-title">
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
