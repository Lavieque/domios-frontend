import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { ApiError } from "../api/http";
import {
  createHouseholdMealPlanTemplate,
  getMealPlanTemplate,
  replaceMealPlanTemplateEntries,
  toEntryRequest,
  type MealPlanTemplateDto,
  type MealPlanTemplateEntryRequest,
} from "../api/mealPlanTemplates";
import {
  applyTemplate,
  ConflictPolicy,
  mealTypeLabels,
  type ApplyTemplateResultDto,
} from "../api/planning";
import { dishTypeLabels, mainProteinLabels, RecipeStatus } from "../api/types";
import { describeError } from "../auth/errors";
import { TemplateDayEditor, type DayRow } from "../components/TemplateDayEditor";
import { HouseholdGate } from "../household/HouseholdGate";
import { useHouseholds } from "../household/useHouseholds";
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today, weekdayName } from "../plan/dates";
import { withoutNamePrefix } from "../plan/templates";

export function MealPlanTemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Receitas que ficaram de fora ao personalizar (vem da navegação da cópia).
  const skippedOnCopy = (location.state as { skipped?: number } | null)?.skipped ?? 0;
  const { current } = useHouseholds();
  const [template, setTemplate] = useState<MealPlanTemplateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Dia aberto para editar, o erro dele e se está a guardar.
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setTemplate(null);
    setEditingDay(null);
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
  // Só uma ementa da própria casa, ainda em rascunho, muda; as outras copiam-se primeiro.
  const editable =
    current !== null && template.ownerHouseholdId === current.householdId && template.status === RecipeStatus.Draft;
  const loaded = template;

  async function copyToHousehold() {
    if (!current) return;
    const usable = loaded.entries.filter((entry) => entry.recipeStatus === RecipeStatus.Published);
    setCopyError(null);
    setCopying(true);
    try {
      const copy = await createHouseholdMealPlanTemplate(current.householdId, {
        name: `${loaded.name} (minha)`.slice(0, 120),
        description: loaded.description,
        durationDays: loaded.durationDays,
        servingsBasis: loaded.servingsBasis,
        tags: loaded.tags,
        // Uma casa só usa receitas publicadas: as que deixaram de o ser ficam de fora da cópia.
        entries: usable.map((entry) => toEntryRequest(entry, loaded.servingsBasis)),
      });
      const skipped = loaded.entries.length - usable.length;
      navigate(`/ementas/${copy.mealPlanTemplateId}`, { state: { skipped } });
    } catch (err) {
      setCopyError(describeError(err));
    } finally {
      setCopying(false);
    }
  }

  async function saveDay(dayIndex: number, rows: DayRow[]) {
    setDayError(null);
    setSaving(true);
    const others: MealPlanTemplateEntryRequest[] = loaded.entries
      .filter((entry) => entry.dayIndex !== dayIndex)
      .map((entry) => toEntryRequest(entry, loaded.servingsBasis));
    const day: MealPlanTemplateEntryRequest[] = rows.map((row, index) => ({
      dayIndex,
      mealType: row.mealType,
      recipeId: row.recipeId,
      servings: row.entry && row.entry.servings !== loaded.servingsBasis ? row.entry.servings : null,
      notes: row.entry?.notes ?? null,
      sortOrder: index,
    }));
    try {
      setTemplate(await replaceMealPlanTemplateEntries(loaded.mealPlanTemplateId, [...others, ...day]));
      setEditingDay(null);
    } catch (err) {
      setDayError(
        describeError(err, {
          "invalid-argument": "A mesma receita está duas vezes na mesma refeição deste dia.",
          "forbidden-recipe-scope": "Essa receita não pode entrar nesta ementa.",
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <nav className="crumb" aria-label="Caminho">
        <Link to="/ementas" className="back-link">
          Ementas prontas
        </Link>
      </nav>
      <h1>{template.name}</h1>
      {template.description && <p className="page-lede">{withoutNamePrefix(template.description, template.name)}</p>}

      <section className="panel">
        <h2>Aplicar ao plano</h2>
        <HouseholdGate>{(household) => <ApplyTemplateForm household={household} template={template} />}</HouseholdGate>
      </section>

      {editable && skippedOnCopy > 0 && (
        <p className="notice">
          {skippedOnCopy === 1
            ? "1 receita da ementa original já não está disponível e ficou de fora da cópia."
            : `${skippedOnCopy} receitas da ementa original já não estão disponíveis e ficaram de fora da cópia.`}
        </p>
      )}

      {current && !editable && (
        <div className="notice template-copy">
          <span>
            {template.ownerHouseholdId === current.householdId
              ? "Esta ementa já foi publicada e não muda. Faz uma cópia para a editar."
              : "Queres trocar receitas? Faz uma cópia desta ementa para a tua casa e edita os dias."}
          </span>
          <button type="button" className="button-secondary" disabled={copying} onClick={copyToHousehold}>
            {copying ? "A copiar…" : "Personalizar esta ementa"}
          </button>
          {copyError && (
            <p className="form-error" role="alert">
              {copyError}
            </p>
          )}
        </div>
      )}

      <h2>
        {template.durationDays} dias · {template.servingsBasis} doses
        {editable && <span className="muted"> · carrega em “Editar” num dia para trocar receitas</span>}
      </h2>
      <div className="week-grid">
        {days.map((dayIndex) => {
          const entries = template.entries.filter((entry) => entry.dayIndex === dayIndex);
          if (editingDay === dayIndex) {
            return (
              <section key={dayIndex} className="day-card is-editing">
                <TemplateDayEditor
                  dayIndex={dayIndex}
                  entries={entries}
                  saving={saving}
                  error={dayError}
                  onSave={(rows) => saveDay(dayIndex, rows)}
                  onCancel={() => {
                    setEditingDay(null);
                    setDayError(null);
                  }}
                />
              </section>
            );
          }
          return (
            <section key={dayIndex} className="day-card">
              <h3 className="day-title">
                Dia {dayIndex}
                {editable && editingDay === null && (
                  <button
                    type="button"
                    className="link-button day-edit"
                    aria-label={`Editar dia ${dayIndex}`}
                    onClick={() => {
                      setDayError(null);
                      setEditingDay(dayIndex);
                    }}
                  >
                    Editar
                  </button>
                )}
              </h3>
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
