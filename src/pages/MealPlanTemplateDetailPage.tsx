import { PageSkeleton } from "../components/PageSkeleton";
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
  // O dia cujo editor acabou de fechar: o foco volta ao "Editar" dele.
  const [closedDay, setClosedDay] = useState<number | null>(null);

  useEffect(() => {
    if (closedDay === null || editingDay !== null) return;
    document.querySelector<HTMLElement>(`[data-edit-day="${closedDay}"]`)?.focus();
    setClosedDay(null);
  }, [closedDay, editingDay]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setTemplate(null);
    setError(null);
    setEditingDay(null);
    getMealPlanTemplate(id)
      .then((data) => active && setTemplate(data))
      .catch((err: unknown) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="page template-page">
        <header className="page-head">
          <h1>Ementa</h1>
        </header>
        <p className="form-error" role="alert">
          Não deu para abrir esta ementa. {error}
        </p>
        <p className="empty-state">
          <Link to="/ementas">Voltar às ementas</Link>
        </p>
      </div>
    );
  }
  if (!template) return <PageSkeleton />;

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
      setClosedDay(dayIndex);
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

  const description = template.description ? withoutNamePrefix(template.description, template.name) : null;

  return (
    <div className="page template-page">
      <nav className="crumb" aria-label="Caminho">
        <Link to="/ementas" className="back-link">
          Ementas prontas
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>{template.name}</h1>
          <p className="page-head-sub">
            {template.durationDays} {template.durationDays === 1 ? "dia" : "dias"} · {template.entries.length}{" "}
            {template.entries.length === 1 ? "refeição" : "refeições"} · {template.servingsBasis}{" "}
            {template.servingsBasis === 1 ? "dose" : "doses"} por refeição
          </p>
        </div>
        <a href="#template-apply" className="button-primary button-lg template-jump">
          Aplicar ao plano
        </a>
      </header>
      {description && <p className="page-lede template-lede">{description}</p>}

      {editable && skippedOnCopy > 0 && (
        <p className="notice">
          {skippedOnCopy === 1
            ? "1 receita da ementa original já não está disponível e ficou de fora da cópia."
            : `${skippedOnCopy} receitas da ementa original já não estão disponíveis e ficaram de fora da cópia.`}
        </p>
      )}

      <div className="week-layout template-layout">
        {/* Os dias da ementa em linhas, como no plano: o número fica sempre na mesma coluna. */}
        <h2 id="template-days" className="visually-hidden">
          Dias
        </h2>
        <ol className="week-days" aria-labelledby="template-days">
          {days.map((dayIndex) => {
            const entries = template.entries.filter((entry) => entry.dayIndex === dayIndex);
            const isEditing = editingDay === dayIndex;
            return (
              <li key={dayIndex} className={isEditing ? "week-day is-editing" : "week-day"}>
                <div className="week-day-date">
                  <span className="week-day-weekday template-day-label">Dia</span>
                  <span className="week-day-number">{dayIndex}</span>
                  {editable && !isEditing && (
                    <button
                      type="button"
                      className="link-button template-day-edit"
                      aria-label={`Editar dia ${dayIndex}`}
                      data-edit-day={dayIndex}
                      disabled={editingDay !== null}
                      onClick={() => {
                        setDayError(null);
                        setEditingDay(dayIndex);
                      }}
                    >
                      Editar
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <TemplateDayEditor
                    dayIndex={dayIndex}
                    entries={entries}
                    saving={saving}
                    error={dayError}
                    onSave={(rows) => saveDay(dayIndex, rows)}
                    onCancel={() => {
                      setEditingDay(null);
                      setDayError(null);
                      setClosedDay(dayIndex);
                    }}
                  />
                ) : entries.length === 0 ? (
                  <p className="week-day-empty">Sem refeições.</p>
                ) : (
                  <ul className="week-day-meals">
                    {entries.map((entry) => (
                      <li key={entry.mealPlanTemplateEntryId} className="week-meal">
                        <span className="week-meal-slot">{mealTypeLabels[entry.mealType]}</span>
                        <span className="week-meal-body">
                          {entry.recipeStatus === RecipeStatus.Published ? (
                            <Link to={`/receitas/${entry.recipeId}`} className="week-meal-dish">
                              {entry.recipeTitle}
                            </Link>
                          ) : (
                            <span className="week-meal-dish is-unavailable">{entry.recipeTitle}</span>
                          )}
                          <span className="week-meal-meta">
                            {[
                              entry.dishType !== null ? dishTypeLabels[entry.dishType] : null,
                              entry.mainProtein !== null ? mainProteinLabels[entry.mainProtein] : null,
                              entry.servings !== template.servingsBasis
                                ? `${entry.servings} ${entry.servings === 1 ? "dose" : "doses"}`
                                : null,
                              entry.recipeStatus !== RecipeStatus.Published ? "Já não está disponível" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>

        <aside className="week-side template-side">
          <section className="side-block" aria-labelledby="template-apply">
            <div className="side-head">
              <h2 id="template-apply">Aplicar ao plano</h2>
            </div>
            <HouseholdGate>{(household) => <ApplyTemplateForm household={household} template={template} />}</HouseholdGate>
          </section>

          {current && !editable && (
            <section className="side-block" aria-labelledby="template-copy">
              <div className="side-head">
                <h2 id="template-copy">Personalizar</h2>
              </div>
              <p className="side-empty">
                {template.ownerHouseholdId === current.householdId
                  ? "Esta ementa já foi publicada e não muda. Faz uma cópia para a editar."
                  : "Queres trocar receitas? Faz uma cópia desta ementa para a tua casa e edita os dias."}
              </p>
              <button type="button" className="button-secondary" disabled={copying} onClick={copyToHousehold}>
                {copying ? "A copiar…" : "Fazer uma cópia para editar"}
              </button>
              {copyError && (
                <p className="form-error" role="alert">
                  {copyError}
                </p>
              )}
            </section>
          )}

          {editable && (
            <section className="side-block" aria-labelledby="template-edit">
              <div className="side-head">
                <h2 id="template-edit">Editar</h2>
              </div>
              <p className="side-empty">
                Esta ementa é da tua casa: carrega em “Editar” num dia para trocar, acrescentar ou tirar receitas.
              </p>
            </section>
          )}
        </aside>
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
            : `${result.createdCount} ${result.createdCount === 1 ? "refeição acrescentada" : "refeições acrescentadas"} de ${longDate(result.from)} a ${longDate(result.to)}.`}
          {result.removedCount > 0 &&
            ` ${result.removedCount} ${result.removedCount === 1 ? "refeição substituída" : "refeições substituídas"}.`}
          {result.skippedMeals.length > 0 &&
            ` ${result.skippedMeals.length} ${result.skippedMeals.length === 1 ? "refeição do plano já estava ocupada e ficou" : "refeições do plano já estavam ocupadas e ficaram"} como estava${result.skippedMeals.length === 1 ? "" : "m"}.`}
          {result.skippedEntries.length > 0 &&
            (result.skippedEntries.length === 1
              ? " 1 receita da ementa já não está disponível e foi saltada."
              : ` ${result.skippedEntries.length} receitas da ementa já não estão disponíveis e foram saltadas.`)}
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
        {submitting ? "A aplicar…" : "Aplicar ao plano"}
      </button>
    </form>
  );
}
