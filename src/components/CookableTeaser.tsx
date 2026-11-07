import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCookableRecipes, RecipeVerdict, type CookableRecipeDto } from "../api/savedRecipes";

const MAX_SHOWN = 3;

interface Props {
  householdId: string;
  /** Muda quando a despensa muda, para voltar a pedir. */
  version: number;
}

/**
 * No topo da despensa: até três receitas que já dá para fazer, as guardadas e planeadas
 * primeiro. Sem nenhuma pronta, não aparece.
 */
export function CookableTeaser({ householdId, version }: Props) {
  const [ready, setReady] = useState<CookableRecipeDto[]>([]);

  useEffect(() => {
    let active = true;
    getCookableRecipes(householdId, MAX_SHOWN)
      .then((result) => {
        if (!active) return;
        const isReady = (r: CookableRecipeDto) => r.verdict !== RecipeVerdict.Missing;
        setReady([...result.saved.filter(isReady), ...result.others.filter(isReady)].slice(0, MAX_SHOWN));
      })
      .catch(() => active && setReady([]));
    return () => {
      active = false;
    };
  }, [householdId, version]);

  if (ready.length === 0) return null;

  return (
    <section className="panel cookable-teaser" aria-labelledby="cookable-teaser-title">
      <h2 id="cookable-teaser-title">Já dá para cozinhar</h2>
      <ul className="cookable-teaser-list">
        {ready.map((recipe) => (
          <li key={recipe.recipeId}>
            <Link to={`/receitas/${recipe.recipeId}`}>{recipe.title}</Link>
            {recipe.savedOrigin !== null || recipe.plannedOn.length > 0 ? (
              <span className="pill pill-accent2">Das tuas</span>
            ) : null}
          </li>
        ))}
      </ul>
      <Link to="/cozinhar">Ver tudo o que posso cozinhar</Link>
    </section>
  );
}
