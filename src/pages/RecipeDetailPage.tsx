import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRecipe } from "../api/client";
import { measurementUnitLabels, recipeDifficultyLabels, type RecipeDto } from "../api/types";

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);

  useEffect(() => {
    if (!id) return;
    getRecipe(id).then(setRecipe);
  }, [id]);

  if (!id) return null;
  if (!recipe) return <p className="muted loading">A carregar…</p>;

  return (
    <div className="page">
      <p>
        <Link to="/receitas">&larr; Receitas</Link>
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
