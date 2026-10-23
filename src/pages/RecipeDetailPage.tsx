import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRecipe } from "../api/client";
import type { PlannedMealDto } from "../api/planning";
import { addItemsFromRecipe, getShoppingList } from "../api/shopping";
import { measurementUnitLabels, recipeDifficultyLabels, type RecipeDto } from "../api/types";
import { AddToPlanForm } from "../components/AddToPlanForm";
import { SendToListForm } from "../components/SendToListForm";
import { HouseholdGate } from "../household/HouseholdGate";
import { longDate, startOfWeek, today } from "../plan/dates";

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
          &larr; Receitas
        </button>
      </p>
      <p className="eyebrow" style={{ margin: "0.75rem 0 0.5rem" }}>
        Receita
      </p>
      <h1>{recipe.title}</h1>
      <p className="muted">
        {recipeDifficultyLabels[recipe.difficulty]} · {recipe.servings} porções
        {recipe.prepTimeMinutes && <> · preparação {recipe.prepTimeMinutes} min</>}
        {recipe.cookTimeMinutes && <> · cozedura {recipe.cookTimeMinutes} min</>}
      </p>
      {recipe.imageUrl && <img className="product-image" src={recipe.imageUrl} alt={recipe.title} />}
      {recipe.description && <p style={{ maxWidth: "42rem" }}>{recipe.description}</p>}

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

      <div className="recipe-detail-grid">
        <div>
          <h2 style={{ margin: "0 0 0.85rem", fontSize: "19px" }}>Ingredientes</h2>
          <ul className="ingredient-list">
            {recipe.ingredients
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((ingredient) => (
                <li key={ingredient.recipeIngredientId}>
                  {ingredient.notes ??
                    `${ingredient.quantity.amount} ${measurementUnitLabels[ingredient.quantity.unit]} ${ingredient.ingredientName}`}
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h2 style={{ margin: "0 0 0.85rem", fontSize: "19px" }}>Preparação</h2>
          <ol>
            {recipe.steps
              .slice()
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step) => (
                <li key={step.recipeStepId}>{step.instruction}</li>
              ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
