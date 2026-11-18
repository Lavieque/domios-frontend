import { useState } from "react";
import { useLoad } from "../useLoad";
import { listSavedRecipes, removeSavedRecipe, saveRecipe } from "../api/savedRecipes";
import { describeError } from "../auth/errors";
import { tr } from "../i18n";

interface Props {
  householdId: string;
  recipeId: string;
}

/** Guardar para cozinhar mais tarde, sem pôr no plano. */
export function SaveRecipeButton({ householdId, recipeId }: Props) {
  const check = useLoad([householdId, recipeId], () => listSavedRecipes(householdId).then((list) => list.some((s) => s.recipeId === recipeId)));
  // Depois de carregar no botão, vale o que se fez; até lá, o que a Api disse.
  const [toggled, setToggled] = useState<{ key: string; saved: boolean } | null>(null);
  const key = `${householdId}:${recipeId}`;
  const saved = toggled?.key === key ? toggled.saved : check.data;
  const setSaved = (value: boolean) => setToggled({ key, saved: value });
  const [busy, setBusy] = useState(false);
  const [actionError, setError] = useState<string | null>(null);
  const error = actionError ?? (check.failure ? tr().ui.saveRecipe.checkFailed : null);

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
      setError(describeError(err, { "saved-recipes-limit": tr().ui.saveRecipe.limit }));
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
        {saved ? tr().ui.saveRecipe.saved : tr().ui.saveRecipe.save}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
