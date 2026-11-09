import { useEffect, useState } from "react";
import { listSavedRecipes, removeSavedRecipe, saveRecipe } from "../api/savedRecipes";
import { describeError } from "../auth/errors";

interface Props {
  householdId: string;
  recipeId: string;
}

/** Guardar para cozinhar mais tarde, sem pôr no plano. */
export function SaveRecipeButton({ householdId, recipeId }: Props) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSaved(null);
    listSavedRecipes(householdId)
      .then((list) => active && setSaved(list.some((s) => s.recipeId === recipeId)))
      .catch(() => active && setError("Não deu para ver se está guardada."));
    return () => {
      active = false;
    };
  }, [householdId, recipeId]);

  async function toggle() {
    setError(null);
    setBusy(true);
    try {
      if (saved) {
        await removeSavedRecipe(householdId, recipeId);
        setSaved(false);
      } else {
        await saveRecipe(householdId, recipeId);
        setSaved(true);
      }
    } catch (err) {
      setError(describeError(err, { "saved-recipes-limit": "Já tens 500 receitas guardadas. Remove algumas primeiro." }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button-secondary button-lg save-recipe"
        aria-pressed={saved === true}
        disabled={saved === null || busy}
        onClick={toggle}
      >
        {saved && (
          <svg className="save-recipe-check" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {saved ? "Guardada" : "Guardar receita"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
