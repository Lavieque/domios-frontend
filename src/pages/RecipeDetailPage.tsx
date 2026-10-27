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

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);
  const [added, setAdded] = useState<PlannedMealDto | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(true);

  useEffect(() => {
    if (!id) return;
    getRecipe(id).then(setRecipe);
  }, [id]);

  if (!id) return null;
  if (!recipe) return <p className="muted loading">A carregar…</p>;

  return (
    <div className="page">
      <p>
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </p>
      <div className={recipe.imageUrl ? "product-hero" : undefined}>
        {recipe.imageUrl && <img className="product-image" src={recipe.imageUrl} alt={recipe.title} />}
        <div>
          <h1>{recipe.title}</h1>
          <ul className="spec-line">
            {recipe.dishType !== null && (
              <li>
                <span>Prato</span>
                <strong>{dishTypeLabels[recipe.dishType]}</strong>
              </li>
            )}
            {recipe.mainProtein !== null && (
              <li>
                <span>Proteína</span>
                <strong>{mainProteinLabels[recipe.mainProtein]}</strong>
              </li>
            )}
            <li>
              <span>Dificuldade</span>
              <strong>{recipeDifficultyLabels[recipe.difficulty]}</strong>
            </li>
            <li>
              <span>Porções</span>
              <strong>{recipe.servings}</strong>
            </li>
            {recipe.prepTimeMinutes !== null && (
              <li>
                <span>Preparação</span>
                <strong>{recipe.prepTimeMinutes} min</strong>
              </li>
            )}
            {recipe.cookTimeMinutes !== null && (
              <li>
                <span>Cozedura</span>
                <strong>{recipe.cookTimeMinutes} min</strong>
              </li>
            )}
          </ul>
          {recipe.description && <p className="page-lede">{recipe.description}</p>}
          {recipe.sourceUrl && (
            <p>
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                Receita original em {sourceHost(recipe.sourceUrl)}
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="recipe-detail-grid">
        <div>
          <h2>Ingredientes</h2>
          <ul className="ingredient-list">
            {recipe.ingredients
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((ingredient) => (
                <li key={ingredient.recipeIngredientId}>
                  {/* notes é a linha original da receita, quando a Api a guardou: substitui o resto. */}
                  <span>
                    {ingredient.notes ?? ingredient.ingredientName}
                    {ingredient.isOptional && <span className="muted"> (opcional)</span>}
                  </span>
                  {!ingredient.notes && (
                    <span className="qty">
                      {quantityFormat.format(ingredient.quantity.amount)} {measurementUnitLabels[ingredient.quantity.unit]}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h2>Preparação</h2>
          <ol className="step-list">
            {recipe.steps
              .slice()
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step) => (
                <li key={step.recipeStepId}>
                  <span>
                    {step.instruction}
                    {step.durationMinutes !== null && <span className="step-minutes">{step.durationMinutes} min</span>}
                  </span>
                </li>
              ))}
          </ol>
        </div>
      </div>

      <div className="recipe-actions">
      <section className="panel">
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
      </section>

      <HouseholdGate withoutHousehold={null}>
        {(household) => (
          <section className="panel">
            <h2>Pôr na lista de compras</h2>
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
          </section>
        )}
      </HouseholdGate>

      </div>
    </div>
  );
}
