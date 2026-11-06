import { useEffect, useState } from "react";
import { getRecipeRestrictions } from "../api/memberPreferences";
import { summarizeAvoided, type MemberAvoidedSummary } from "../household/avoidedMatches";
import { useHouseholds } from "../household/useHouseholds";

/**
 * Avisa quando a receita leva algo que alguém da casa marcou para evitar.
 * Sem correspondências não mostra nada (não diz "sem problema") e uma falha
 * a pedir não estraga a receita.
 */
export function RecipeAvoidedNotice({ recipeId }: { recipeId: string }) {
  const householdId = useHouseholds().current?.householdId ?? null;
  const [members, setMembers] = useState<MemberAvoidedSummary[]>([]);

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;
    setMembers([]);
    getRecipeRestrictions(householdId, recipeId)
      .then((result) => !cancelled && setMembers(summarizeAvoided(result)))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [householdId, recipeId]);

  if (members.length === 0) return null;

  return (
    <section className="panel avoided-notice" aria-label="Alimentos que alguém da casa evita">
      <h2>Tem alimentos que alguém da casa evita</h2>
      <ul className="avoided-notice-list">
        {members.map((member) => (
          <li key={member.memberId}>
            <strong>{member.name}</strong>
            <ul>
              {member.required.map((match) => (
                <li key={`${match.ingredientId}-${match.avoidedIngredient}`}>
                  <span className={match.result === "Conflict" ? "pill pill-danger" : "pill pill-muted"}>
                    {match.result === "Conflict" ? "Evita" : "Pouco"}
                  </span>{" "}
                  {match.name}
                  {match.note && <span className="muted"> — {match.note}</span>}
                </li>
              ))}
              {member.optional.map((match) => (
                <li key={`opt-${match.ingredientId}-${match.avoidedIngredient}`}>
                  <span className="pill pill-muted">Opcional</span> {match.name}
                  <span className="muted"> — pode ficar de fora</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="muted">É a lista de cada membro, não um conselho médico.</p>
    </section>
  );
}
