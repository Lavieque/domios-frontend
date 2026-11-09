import { RecipeVerdict, SavedRecipeOrigin, type CookableRecipeDto } from "../api/savedRecipes";
import { urgency, type UrgencyLevel } from "../pantry/urgency";
import { shortDate } from "../plan/dates";
import { RecipeRow } from "./RecipeRow";

interface Props {
  recipes: CookableRecipeDto[];
  /** Mostra "Remover das guardadas" nas guardadas. */
  onRemove?: (recipeId: string) => void;
}

/** A linha de prontidão, com o ponto de Hoje: verde tens tudo, vermelho falta, tinta fraca quando não se sabe. */
function Readiness({ recipe }: { recipe: CookableRecipeDto }) {
  const counts = `${recipe.availableCount} de ${recipe.requiredCount} ingredientes em casa`;
  if (recipe.verdict === RecipeVerdict.CanCook) {
    return (
      <span className="readiness readiness-compact readiness-ready">
        <span className="readiness-dot" aria-hidden="true" />
        <span>
          <strong>Tens tudo</strong> · {counts}
        </span>
      </span>
    );
  }
  if (recipe.verdict === RecipeVerdict.Uncertain) {
    return (
      <span className="readiness readiness-compact readiness-unknown">
        <span className="readiness-dot" aria-hidden="true" />
        <span>
          <strong>Deve dar</strong> · {counts}
        </span>
      </span>
    );
  }
  const missing = recipe.missingIngredients.length;
  return (
    <span className="readiness readiness-compact">
      <span className="readiness-dot" aria-hidden="true" />
      <span>
        <strong>{missing > 0 ? `Falta ${missing}` : "Falta algo"}</strong>
        {missing > 0 && <>: {recipe.missingIngredients.map((i) => i.name).join(", ")}</>}
      </span>
    </span>
  );
}

/** O que está a acabar, com o ponto de Usar primeiro: o tamanho diz a pressa do mais urgente. */
function Expiring({ items }: { items: CookableRecipeDto["expiringIngredients"] }) {
  const graded = items.map((i) => ({ ...i, ...urgency(i.expiresAt) }));
  const level = Math.max(...graded.map((i) => i.level)) as UrgencyLevel;
  return (
    <span className={`recipe-row-expiring urgency-${level}`}>
      <span className="urgency-dot" aria-hidden="true" />
      <span>Usar primeiro: {graded.map((i) => `${i.name} (${i.label.toLowerCase()})`).join(", ")}</span>
    </span>
  );
}

/** Receitas com o que a despensa cobre, em linhas: prontidão, o que está a acabar, quando está no plano. */
export function CookableRecipeList({ recipes, onRemove }: Props) {
  return (
    <ul className="recipe-rows">
      {recipes.map((recipe) => {
        const notes = [
          recipe.plannedOn.length > 0 ? `No plano: ${recipe.plannedOn.map(shortDate).join(", ")}` : null,
          recipe.savedOrigin === SavedRecipeOrigin.ShoppingList ? "Compraste para esta" : null,
        ].filter(Boolean);
        return (
          <RecipeRow
            key={recipe.recipeId}
            title={recipe.title}
            to={`/receitas/${recipe.recipeId}`}
            imageUrl={recipe.imageUrl}
            action={
              onRemove && recipe.savedOrigin !== null ? (
                <button type="button" className="link-button" onClick={() => onRemove(recipe.recipeId)}>
                  Remover das guardadas
                </button>
              ) : undefined
            }
          >
            <Readiness recipe={recipe} />
            {recipe.expiringIngredients.length > 0 && <Expiring items={recipe.expiringIngredients} />}
            {notes.length > 0 && <span className="recipe-row-meta">{notes.join(" · ")}</span>}
          </RecipeRow>
        );
      })}
    </ul>
  );
}
