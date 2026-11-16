import { useEffect, useState } from "react";
import { getRecipeRestrictions } from "../api/memberPreferences";
import { summarizeAvoided, summarizeDietConflicts, type MemberAvoidedSummary, type MemberDietConflict } from "../household/avoidedMatches";
import { useHouseholds } from "../household/useHouseholds";
import { tr } from "../i18n";

/**
 * Avisa quando a receita leva algo que alguém da casa marcou para evitar.
 * Sem correspondências não mostra nada (não diz "sem problema") e uma falha
 * a pedir não estraga a receita.
 */
export function RecipeAvoidedNotice({ recipeId }: { recipeId: string }) {
  const householdId = useHouseholds().current?.householdId ?? null;
  const [members, setMembers] = useState<MemberAvoidedSummary[]>([]);
  const [diets, setDiets] = useState<MemberDietConflict[]>([]);

  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;
    setMembers([]);
    setDiets([]);
    getRecipeRestrictions(householdId, recipeId)
      .then((result) => {
        if (cancelled) return;
        setMembers(summarizeAvoided(result));
        setDiets(summarizeDietConflicts(result));
      })
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [householdId, recipeId]);

  if (members.length === 0 && diets.length === 0) return null;

  return (
    <>
    {diets.length > 0 && (
      <section className="avoided-notice" aria-label={tr().ui.avoided.diets}>
        <div className="avoided-notice-head">
          <h2>{tr().ui.avoided.dietTitle}</h2>
        </div>
        <ul className="avoided-notice-members">
          {diets.map((d) => (
            <li key={`${d.memberId}-${d.diet}`} className="avoided-notice-member">
              <span className="avoided-notice-who">{d.name}</span>
              <span>
                {tr().ui.avoided.diet(d.diet)}
                {d.reasons.length > 0 && <span className="muted"> · {d.reasons.join(", ")}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    )}
    {members.length > 0 && (
    <section className="avoided-notice" aria-labelledby="avoided-notice-title">
      <div className="avoided-notice-head">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="1" fill="currentColor" />
        </svg>
        <h2 id="avoided-notice-title">{tr().ui.avoided.title}</h2>
      </div>

      <ul className="avoided-notice-members">
        {members.map((member) => (
          <li key={member.memberId} className="avoided-notice-member">
            <span className="avoided-notice-who">{member.name}</span>
            <ul className="avoided-notice-items">
              {member.required.map((match) => (
                <li key={`${match.ingredientId}-${match.avoidedIngredient}`}>
                  <span className={match.result === "Conflict" ? "pill pill-danger" : "pill pill-muted"}>
                    {match.result === "Conflict" ? tr().ui.avoided.avoids : tr().ui.avoided.little}
                  </span>
                  <span>{match.name}</span>
                  {match.note && <span className="muted">{match.note}</span>}
                </li>
              ))}
              {member.optional.map((match) => (
                <li key={`opt-${match.ingredientId}-${match.avoidedIngredient}`}>
                  <span className="pill pill-muted">{tr().ui.avoided.optional}</span>
                  <span>{match.name}</span>
                  <span className="muted">{tr().ui.avoided.canSkip}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="avoided-notice-foot muted">{tr().ui.avoided.foot}</p>
    </section>
    )}
    </>
  );
}
