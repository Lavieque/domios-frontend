import { RecipeVerdict, SavedRecipeOrigin, type CookableRecipeDto } from "../api/savedRecipes";
import { shortDate } from "../plan/dates";
import { RecipePhoto } from "./RecipePhoto";
import { ShelfLabel } from "./ShelfLabel";

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

/** Receitas com o que a despensa cobre, em cartões como os de /receitas: veredito, o que falta e o que está a expirar. */
export function CookableRecipeList({ recipes, onRemove }: Props) {
  return (
    <div className="recipe-grid">
      {recipes.map((recipe, index) => (
        <div key={recipe.recipeId} className="cook-card">
          <ShelfLabel
            to={`/receitas/${recipe.recipeId}`}
            index={index}
            className="recipe-card"
            media={<RecipePhoto imageUrl={recipe.imageUrl} />}
          >
            <div className="recipe-card-title">{recipe.title}</div>
            <div className="recipe-card-pills">
              <span className={verdictPill[recipe.verdict]}>{verdictLabels[recipe.verdict]}</span>
              <span className="pill pill-muted">
                {recipe.availableCount}/{recipe.requiredCount} ingredientes
              </span>
              {recipe.savedOrigin === SavedRecipeOrigin.ShoppingList && (
                <span className="pill pill-muted">Compraste para esta</span>
              )}
              {recipe.plannedOn.length > 0 && (
                <span className="pill pill-muted">No plano: {recipe.plannedOn.map(shortDate).join(", ")}</span>
              )}
            </div>
            {recipe.missingIngredients.length > 0 && (
              <p className="muted cook-card-note clamp-3">
                Falta: {recipe.missingIngredients.map((i) => i.name).join(", ")}
              </p>
            )}
            {recipe.expiringIngredients.length > 0 && (
              <p className="cook-card-note cook-card-expiring clamp-3">
                A expirar: {recipe.expiringIngredients.map((i) => `${i.name} (${shortDate(i.expiresAt)})`).join(", ")}
              </p>
            )}
          </ShelfLabel>
          {onRemove && recipe.savedOrigin !== null && (
            <button type="button" className="link-button cook-card-action" onClick={() => onRemove(recipe.recipeId)}>
              Remover das guardadas
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
