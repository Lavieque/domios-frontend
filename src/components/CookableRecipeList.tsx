import { Link } from "react-router-dom";
import { RecipeVerdict, SavedRecipeOrigin, type CookableRecipeDto } from "../api/savedRecipes";
import { shortDate } from "../plan/dates";

const verdictLabels: Record<RecipeVerdict, string> = {
  [RecipeVerdict.CanCook]: "Tens tudo",
  [RecipeVerdict.Uncertain]: "Deve dar",
  [RecipeVerdict.Missing]: "Falta algo",
};

const verdictPill: Record<RecipeVerdict, string> = {
  [RecipeVerdict.CanCook]: "pill pill-accent2",
  [RecipeVerdict.Uncertain]: "pill pill-warning",
  [RecipeVerdict.Missing]: "pill pill-muted",
};

interface Props {
  recipes: CookableRecipeDto[];
  /** Mostra "Remover" nas guardadas. */
  onRemove?: (recipeId: string) => void;
}

/** Receitas com o que a despensa cobre: veredito, o que falta e o que está a expirar. */
export function CookableRecipeList({ recipes, onRemove }: Props) {
  return (
    <ul className="suggestion-list">
      {recipes.map((recipe) => (
        <li key={recipe.recipeId}>
          <Link to={`/receitas/${recipe.recipeId}`} className="meal-title">
            {recipe.title}
          </Link>
          <div className="recipe-card-pills">
            <span className={verdictPill[recipe.verdict]}>{verdictLabels[recipe.verdict]}</span>
            <span className="pill pill-muted">
              {recipe.availableCount}/{recipe.requiredCount} ingredientes
            </span>
            {recipe.expiringIngredients.length > 0 && <span className="pill pill-warning">Aproveita o que está a expirar</span>}
            {recipe.savedOrigin === SavedRecipeOrigin.ShoppingList && (
              <span className="pill pill-muted">Compraste para esta</span>
            )}
            {recipe.plannedOn.length > 0 && (
              <span className="pill pill-muted">No plano: {recipe.plannedOn.map(shortDate).join(", ")}</span>
            )}
          </div>
          {recipe.missingIngredients.length > 0 && (
            <p className="muted suggestion-missing">Falta: {recipe.missingIngredients.map((i) => i.name).join(", ")}</p>
          )}
          {recipe.expiringIngredients.length > 0 && (
            <p className="muted suggestion-missing">
              A expirar: {recipe.expiringIngredients.map((i) => `${i.name} (${shortDate(i.expiresAt)})`).join(", ")}
            </p>
          )}
          {onRemove && recipe.savedOrigin !== null && (
            <div>
              <button type="button" className="link-button" onClick={() => onRemove(recipe.recipeId)}>
                Remover das guardadas
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
