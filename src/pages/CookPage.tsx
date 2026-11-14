import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { getCookableRecipes, RecipeVerdict, removeSavedRecipe, type CookableRecipesDto } from "../api/savedRecipes";
import { describeError } from "../auth/errors";
import { FeatureCard } from "../components/FeatureCard";
import { CookableRecipeList } from "../components/CookableRecipeList";
import { HouseholdGate } from "../household/HouseholdGate";
import { tr } from "../i18n";

export function CookPage() {
  return <HouseholdGate>{(household) => <Cook household={household} />}</HouseholdGate>;
}

/** "O que posso cozinhar com o que tenho?" — as receitas guardadas e planeadas, e outras que a despensa cobre. */
function Cook({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const [result, setResult] = useState<CookableRecipesDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getCookableRecipes(householdId)
      .then((data) => active && setResult(data))
      .catch((err) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [householdId, version]);

  async function remove(recipeId: string) {
    setError(null);
    try {
      await removeSavedRecipe(householdId, recipeId);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(describeError(err));
    }
  }

  // O destaque: a primeira que dá para fazer já, das guardadas e depois das outras.
  const all = result ? [...result.saved, ...result.others] : [];
  const suggestion = all.find((r) => r.verdict === RecipeVerdict.CanCook) ?? all[0] ?? null;

  return (
    <div className="page cook-page">
      <header className="page-head">
        <div>
          <h1>{tr().cook.title}</h1>
          <p className="page-head-sub">{tr().cook.subtitle(household.name)}</p>
        </div>
        <Link to="/cozinhar/feitas" className="button-secondary">
          {tr().cook.cooked}
        </Link>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!result && !error && <p className="muted loading">{tr().common.loading}</p>}

      {result && suggestion && (
        <FeatureCard
          eyebrow={tr().cook.suggestion}
          title={suggestion.title}
          meta={tr().cook.meta(suggestion.servings, suggestion.availableCount, suggestion.requiredCount)}
          imageUrl={suggestion.imageUrl}
          to={`/receitas/${suggestion.recipeId}`}
        />
      )}

      {result && (
        <div className="cook-sections">
          <section className="panel cook-section">
            <h2>{tr().cook.yours}</h2>
            {result.saved.length === 0 ? (
              <p className="muted">
                {tr().cook.noSaved.before} <Link to="/receitas">{tr().cook.noSaved.link}</Link> {tr().cook.noSaved.after}
              </p>
            ) : (
              <CookableRecipeList recipes={result.saved} onRemove={remove} />
            )}
          </section>

          <section className="panel cook-section">
            <h2>{tr().cook.alsoPossible}</h2>
            {result.others.length === 0 ? (
              <p className="muted">
                {tr().cook.nothingElse} <Link to="/despensa">{tr().cook.seePantry}</Link>
              </p>
            ) : (
              <CookableRecipeList recipes={result.others} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
