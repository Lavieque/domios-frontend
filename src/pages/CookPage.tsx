import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { getCookableRecipes, removeSavedRecipe, type CookableRecipesDto } from "../api/savedRecipes";
import { describeError } from "../auth/errors";
import { CookableRecipeList } from "../components/CookableRecipeList";
import { HouseholdGate } from "../household/HouseholdGate";

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

  return (
    <div className="page">
      <h1>O que posso cozinhar</h1>
      <p className="page-sub">Com o que tens na despensa de {household.name}</p>
      <p>
        <Link to="/cozinhar/feitas">Ver as receitas que já fizeste</Link>
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!result && !error && <p className="muted loading">A carregar…</p>}

      {result && (
        <div className="plan-panels">
          <section className="panel">
            <h2>As tuas receitas</h2>
            {result.saved.length === 0 ? (
              <p className="muted">
                Ainda não guardaste receitas. Abre uma <Link to="/receitas">receita</Link> e carrega em “Guardar
                receita”; as que pões na lista de compras ficam guardadas sozinhas.
              </p>
            ) : (
              <CookableRecipeList recipes={result.saved} onRemove={remove} />
            )}
          </section>

          <section className="panel">
            <h2>Também dá para fazer</h2>
            {result.others.length === 0 ? (
              <p className="muted">
                Nada mais com o que está na despensa. <Link to="/despensa">Ver a despensa</Link>
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
