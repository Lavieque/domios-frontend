import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { ApiError } from "../api/http";
import { getMealPlanTemplate, type MealPlanTemplateDto } from "../api/mealPlanTemplates";
import {
  applyTemplate,
  ConflictPolicy,
  mealTypeLabels,
  type ApplyTemplateResultDto,
} from "../api/planning";
import { dishTypeLabels, mainProteinLabels } from "../api/types";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today, weekdayName } from "../plan/dates";

export function MealPlanTemplateDetailPage() {
  const { id } = useParams();
  const [template, setTemplate] = useState<MealPlanTemplateDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMealPlanTemplate(id)
      .then(setTemplate)
      .catch((err: unknown) => setError(describeError(err)));
  }, [id]);

  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (!template) return <p className="muted loading">A carregar…</p>;

  const days = Array.from({ length: template.durationDays }, (_, i) => i + 1);

  return (
    <div className="page">
      <Link to="/ementas" className="back-link">
        Ementas prontas
      </Link>
      <h1>{template.name}</h1>
      {template.description && <p className="muted">{template.description}</p>}

      <section className="panel">
        <h2>Aplicar ao plano</h2>
        <HouseholdGate>{(household) => <ApplyTemplateForm household={household} template={template} />}</HouseholdGate>
      </section>

      <h2>
        {template.durationDays} dias · {template.servingsBasis} doses
      </h2>
      <div className="week-grid">
        {days.map((dayIndex) => {
          const entries = template.entries.filter((entry) => entry.dayIndex === dayIndex);
          return (
            <section key={dayIndex} className="day-card">
              <h3 className="day-title">Dia {dayIndex}</h3>
              {entries.length === 0 && <p className="muted day-empty">Sem refeições.</p>}
              <ul className="day-meals">
                {entries.map((entry) => (
                  <li key={entry.mealPlanTemplateEntryId} className={entry.recipeImageUrl ? "has-thumb" : undefined}>
                    {entry.recipeImageUrl && <img className="meal-thumb" src={entry.recipeImageUrl} alt="" loading="lazy" />}
                    <span className="meal-type">{mealTypeLabels[entry.mealType]}</span>
                    <Link to={`/receitas/${entry.recipeId}`} className="meal-title">
                      {entry.recipeTitle}
                    </Link>
                    <span className="meal-meta muted">
                      {[
                        entry.dishType !== null ? dishTypeLabels[entry.dishType] : null,
                        entry.mainProtein !== null ? mainProteinLabels[entry.mainProtein] : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const policyLabels: Record<ConflictPolicy, string> = {
  [ConflictPolicy.Skip]: "Manter o que já está planeado",
  [ConflictPolicy.Replace]: "Substituir o que já está planeado (nunca o que já foi cozinhado)",
  [ConflictPolicy.Fail]: "Não aplicar se houver refeições ocupadas",
};

function ApplyTemplateForm({ household, template }: { household: CallerHouseholdDto; template: MealPlanTemplateDto }) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => addDays(startOfWeek(today()), 7));
  const [servings, setServings] = useState(String(template.servingsBasis));
  const [policy, setPolicy] = useState<ConflictPolicy>(ConflictPolicy.Skip);
  const [result, setResult] = useState<ApplyTemplateResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const endDate = isIsoDate(startDate) ? addDays(startDate, template.durationDays - 1) : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const servingsNumber = Number(servings);
    if (!isIsoDate(startDate)) {
      setError("Escolhe o primeiro dia.");
      return;
    }
    if (!Number.isInteger(servingsNumber) || servingsNumber < 1 || servingsNumber > 50) {
      setError("As doses têm de ser entre 1 e 50.");
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      setResult(
        await applyTemplate(household.householdId, {
          mealPlanTemplateId: template.mealPlanTemplateId,
          startDate,
          conflictPolicy: policy,
          servings: servingsNumber === template.servingsBasis ? null : servingsNumber,
        }),
      );
    } catch (err) {
      if (err instanceof ApiError && err.type === "plan-conflict") {
        setError("Já há refeições planeadas nesses dias. Escolhe manter ou substituir.");
      } else {
        setError(describeError(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div>
        <p className="notice">
          {result.createdCount === 0
            ? "Nada foi acrescentado ao plano."
            : `${result.createdCount} refeições acrescentadas de ${longDate(result.from)} a ${longDate(result.to)}.`}
          {result.removedCount > 0 && ` ${result.removedCount} refeições substituídas.`}
          {result.skippedMeals.length > 0 &&
            ` ${result.skippedMeals.length} ${result.skippedMeals.length === 1 ? "refeição do plano já estava ocupada e ficou" : "refeições do plano já estavam ocupadas e ficaram"} como estava${result.skippedMeals.length === 1 ? "" : "m"}.`}
          {result.skippedEntries.length > 0 &&
            ` ${result.skippedEntries.length} receitas da ementa já não estão disponíveis e foram saltadas.`}
        </p>
        {result.restrictionWarnings.length > 0 && (
          <div className="notice notice-warning">
            <span>Atenção às restrições alimentares:</span>
            <ul className="ingredient-list">
              {result.restrictionWarnings.map((warning) => (
                <li key={warning.recipeId}>
                  <strong>{warning.title}</strong> ({warning.dates.map(shortDate).join(", ")}) —{" "}
                  {warning.members.map((m) => m.name).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="button-row">
          <button
            type="button"
            className="button-primary"
            onClick={() => navigate(`/plano?semana=${startOfWeek(result.from)}`)}
          >
            Ver o plano
          </button>
          <button type="button" className="button-secondary" onClick={() => setResult(null)}>
            Aplicar outra vez
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="auth-form apply-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Primeiro dia</span>
        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        {endDate && (
          <small className="muted">
            De {weekdayName(startDate)}, {longDate(startDate)}, a {weekdayName(endDate)}, {longDate(endDate)}.
          </small>
        )}
      </label>
      <label className="form-field">
        <span>Doses por refeição</span>
        <input type="number" min={1} max={50} required value={servings} onChange={(e) => setServings(e.target.value)} />
      </label>
      <label className="form-field">
        <span>Se já houver refeições nesses dias</span>
        <select
          className="category-select"
          value={policy}
          onChange={(e) => setPolicy(Number(e.target.value) as ConflictPolicy)}
        >
          {[ConflictPolicy.Skip, ConflictPolicy.Replace, ConflictPolicy.Fail].map((p) => (
            <option key={p} value={p}>
              {policyLabels[p]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button-primary" disabled={submitting}>
        {submitting ? "A aplicar…" : `Aplicar a ${household.name}`}
      </button>
    </form>
  );
}
