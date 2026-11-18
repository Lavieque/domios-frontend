import { Busy } from "./Busy";
import { useEffect, useState, type FormEvent } from "react";
import { useLoad } from "../useLoad";
import { searchIngredients, type IngredientDto } from "../api/client";
import type { MemberDto } from "../api/households";
import {
  clearNutritionGoals,
  getAvoidedIngredients,
  getNutritionGoals,
  removeAvoidedIngredient,
  setAvoidedIngredient,
  setNutritionGoals,
  type AvoidedIngredientDto,
  type AvoidSeverity,
} from "../api/memberPreferences";
import { describeError } from "../auth/errors";
import { GOAL_FIELDS, goalValuesFrom, parseGoalValues, type GoalValues } from "../household/goalsForm";
import { localeOf } from "../i18n/format";
import { localized, tr } from "../i18n";

const PREFERENCE_ERRORS = localized((t) => ({
  "forbidden-household-role": t.prefs.errors.forbidden,
  "invalid-argument": t.prefs.errors.invalid,
  "invariant-violation": t.prefs.errors.full,
  "not-found": t.prefs.errors.notFound,
}));

interface PanelProps {
  householdId: string;
  member: MemberDto;
  /** O próprio membro ou um Admin; os outros só leem. */
  canEdit: boolean;
  onClose: () => void;
}

const severityLabels = localized<Record<AvoidSeverity, string>>((t) => t.prefs.severity);

/** A lista de alimentos que o membro escolheu evitar ou limitar. É dele: não é um conselho médico. */
export function AvoidedIngredientsPanel({ householdId, member, canEdit, onClose }: PanelProps) {
  const [items, setItems] = useState<AvoidedIngredientDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAvoidedIngredients(householdId, member.memberId)
      .then((result) => !cancelled && setItems(result.items))
      .catch((err: unknown) => !cancelled && setError(describeError(err, PREFERENCE_ERRORS)));
    return () => {
      cancelled = true;
    };
  }, [householdId, member.memberId]);

  async function handleRemove(item: AvoidedIngredientDto) {
    setError(null);
    setBusyId(item.ingredientId);
    try {
      await removeAvoidedIngredient(householdId, member.memberId, item.ingredientId);
      setItems((current) => (current ?? []).filter((i) => i.ingredientId !== item.ingredientId));
    } catch (err) {
      setError(describeError(err, PREFERENCE_ERRORS));
    } finally {
      setBusyId(null);
    }
  }

  function handleSaved(saved: AvoidedIngredientDto) {
    setItems((current) => {
      const rest = (current ?? []).filter((i) => i.ingredientId !== saved.ingredientId);
      return [...rest, saved].sort((a, b) => a.name.localeCompare(b.name, localeOf()));
    });
  }

  return (
    <section className="member-panel preference-panel" aria-label={tr().prefs.avoidedOf(member.name)}>
      <p className="muted preference-note">
        {tr().prefs.avoidedNote(member.name)}
      </p>

      {items === null && !error && <p className="muted loading">{tr().common.loading}</p>}
      {items !== null && items.length === 0 && <p className="muted">{tr().prefs.emptyList}</p>}

      {items !== null && items.length > 0 && (
        <ul className="avoided-list">
          {items.map((item) => (
            <li key={item.ingredientId} className="avoided-row">
              <span className="avoided-name">{item.name}</span>
              <span className={item.severity === "Avoid" ? "pill pill-danger" : "pill pill-muted"}>
                {severityLabels[item.severity]}
              </span>
              {item.note && <span className="muted avoided-note">{item.note}</span>}
              {canEdit && (
                <button
                  type="button"
                  className="row-action"
                  disabled={busyId === item.ingredientId}
                  onClick={() => handleRemove(item)}
                >
                  {tr().prefs.remove}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && items !== null && (
        <AddAvoidedForm
          householdId={householdId}
          memberId={member.memberId}
          onSaved={handleSaved}
          onError={setError}
        />
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="button" className="button-secondary" onClick={onClose}>
          {tr().common.close}
        </button>
      </div>
    </section>
  );
}

interface AddAvoidedFormProps {
  householdId: string;
  memberId: string;
  onSaved: (item: AvoidedIngredientDto) => void;
  onError: (message: string | null) => void;
}

function AddAvoidedForm({ householdId, memberId, onSaved, onError }: AddAvoidedFormProps) {
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<IngredientDto | null>(null);
  const [severity, setSeverity] = useState<AvoidSeverity>("Avoid");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const text = search.trim();
  const found = useLoad(text.length < 2 || chosen ? null : [text], () => searchIngredients(text), { delay: 250 });
  const results: IngredientDto[] = text.length < 2 || chosen ? [] : (found.data?.items ?? []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!chosen) return;
    onError(null);
    setBusy(true);
    try {
      onSaved(await setAvoidedIngredient(householdId, memberId, chosen.ingredientId, severity, note.trim() || null));
      setChosen(null);
      setSearch("");
      setNote("");
    } catch (err) {
      onError(describeError(err, PREFERENCE_ERRORS));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="member-form avoided-form" onSubmit={handleSubmit}>
      <label className="form-field member-form-wide">
        <span>{tr().prefs.addFood}</span>
        <input
          type="search"
          placeholder={tr().prefs.addPlaceholder}
          autoComplete="off"
          value={chosen ? (chosen.displayName ?? chosen.name) : search}
          onChange={(e) => {
            setChosen(null);
            setSearch(e.target.value);
          }}
        />
      </label>

      {results.length > 0 && (
        <div className="chip-row member-form-wide" role="group" aria-label={tr().prefs.results}>
          {results.map((ingredient) => (
            <button
              key={ingredient.ingredientId}
              type="button"
              className="chip"
              onClick={() => setChosen(ingredient)}
            >
              {ingredient.displayName ?? ingredient.name}
            </button>
          ))}
        </div>
      )}

      {chosen && (
        <>
          <label className="form-field">
            <span>{tr().prefs.howMuch}</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as AvoidSeverity)}>
              <option value="Avoid">{tr().prefs.avoid}</option>
              <option value="Limit">{tr().prefs.limit}</option>
            </select>
          </label>
          <label className="form-field">
            <span>{tr().prefs.note}</span>
            <input
              type="text"
              maxLength={200}
              placeholder={tr().prefs.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <small>{tr().prefs.optional}</small>
          </label>
          <div className="button-row member-form-wide">
            <button type="submit" className="button-primary" disabled={busy}>
              {busy ? <Busy>{tr().common.saving}</Busy> : tr().prefs.add}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

/** Alvos por dia que o membro escolhe; o DomiOS só compara com eles, nunca sugere um valor. */
export function NutritionGoalsPanel({ householdId, member, canEdit, onClose }: PanelProps) {
  const [values, setValues] = useState<GoalValues | null>(null);
  const [isSet, setIsSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNutritionGoals(householdId, member.memberId)
      .then((goals) => {
        if (cancelled) return;
        setValues(goalValuesFrom(goals));
        setIsSet(goals.isSet);
      })
      .catch((err: unknown) => !cancelled && setError(describeError(err, PREFERENCE_ERRORS)));
    return () => {
      cancelled = true;
    };
  }, [householdId, member.memberId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values) return;
    setError(null);
    setSaved(false);

    const parsed = parseGoalValues(values);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setBusy(true);
    try {
      const goals = await setNutritionGoals(householdId, member.memberId, parsed.request);
      setValues(goalValuesFrom(goals));
      setIsSet(true);
      setSaved(true);
    } catch (err) {
      setError(describeError(err, PREFERENCE_ERRORS));
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await clearNutritionGoals(householdId, member.memberId);
      setValues(goalValuesFrom(null));
      setIsSet(false);
    } catch (err) {
      setError(describeError(err, PREFERENCE_ERRORS));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="member-panel preference-panel" aria-label={tr().prefs.goalsOf(member.name)}>
      <p className="muted preference-note">
        {tr().prefs.goalsNote(member.name)}
      </p>

      {!values && !error && <p className="muted loading">{tr().common.loading}</p>}

      {values && (
        <form className="member-form" onSubmit={handleSubmit}>
          {GOAL_FIELDS.map((field) => (
            <label key={field.key} className="form-field">
              <span>{field.label}</span>
              <input
                type="text"
                inputMode="decimal"
                disabled={!canEdit}
                value={values[field.key]}
                onChange={(e) => {
                  setSaved(false);
                  setValues({ ...values, [field.key]: e.target.value });
                }}
              />
              <small>{field.unit}</small>
            </label>
          ))}
          {error && (
            <p className="form-error member-form-wide" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="muted member-form-wide" role="status">
              {tr().prefs.saved}
            </p>
          )}
          <div className="button-row member-form-wide">
            {canEdit && (
              <button type="submit" className="button-primary" disabled={busy}>
                {busy ? <Busy>{tr().common.saving}</Busy> : tr().common.save}
              </button>
            )}
            {canEdit && isSet && (
              <button type="button" className="button-danger" onClick={handleClear} disabled={busy}>
                {tr().prefs.clearGoals}
              </button>
            )}
            <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
              {tr().common.close}
            </button>
          </div>
        </form>
      )}

      {!values && error && (
        <>
          <p className="form-error" role="alert">
            {error}
          </p>
          <div className="button-row">
            <button type="button" className="button-secondary" onClick={onClose}>
              {tr().common.close}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
