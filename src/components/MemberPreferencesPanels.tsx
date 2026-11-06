import { useEffect, useState, type FormEvent } from "react";
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

const PREFERENCE_ERRORS = {
  "forbidden-household-role": "Só o próprio membro ou um administrador da casa pode mudar isto.",
  "invalid-argument": "Algum valor não é válido. Confirma o que escreveste.",
  "invariant-violation": "Já há 200 alimentos nesta lista.",
  "not-found": "Esse alimento já não existe.",
};

interface PanelProps {
  householdId: string;
  member: MemberDto;
  /** O próprio membro ou um Admin; os outros só leem. */
  canEdit: boolean;
  onClose: () => void;
}

const severityLabels: Record<AvoidSeverity, string> = {
  Avoid: "Evitar",
  Limit: "Pouco",
};

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
      return [...rest, saved].sort((a, b) => a.name.localeCompare(b.name, "pt-PT"));
    });
  }

  return (
    <section className="member-panel preference-panel" aria-label={`Alimentos a evitar de ${member.name}`}>
      <p className="muted preference-note">
        A lista é de {member.name}: o DomiOS só a repete nas receitas, não diz o que se deve comer.
      </p>

      {items === null && !error && <p className="muted loading">A carregar…</p>}
      {items !== null && items.length === 0 && <p className="muted">Ainda não há alimentos nesta lista.</p>}

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
                  Tirar
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
          Fechar
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
  const [results, setResults] = useState<IngredientDto[]>([]);
  const [chosen, setChosen] = useState<IngredientDto | null>(null);
  const [severity, setSeverity] = useState<AvoidSeverity>("Avoid");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const text = search.trim();
    if (text.length < 2 || chosen) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchIngredients(text)
        .then((page) => !cancelled && setResults(page.items))
        .catch(() => !cancelled && setResults([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, chosen]);

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
        <span>Acrescentar alimento</span>
        <input
          type="search"
          placeholder="Ex.: tomate, café, cebola"
          autoComplete="off"
          value={chosen ? (chosen.displayName ?? chosen.name) : search}
          onChange={(e) => {
            setChosen(null);
            setSearch(e.target.value);
          }}
        />
      </label>

      {results.length > 0 && (
        <div className="chip-row member-form-wide" role="group" aria-label="Resultados">
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
            <span>Quanto</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as AvoidSeverity)}>
              <option value="Avoid">Evitar</option>
              <option value="Limit">Só um pouco</option>
            </select>
          </label>
          <label className="form-field">
            <span>Nota</span>
            <input
              type="text"
              maxLength={200}
              placeholder="Ex.: só cru, à noite"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <small>Opcional.</small>
          </label>
          <div className="button-row member-form-wide">
            <button type="submit" className="button-primary" disabled={busy}>
              {busy ? "A guardar…" : "Acrescentar"}
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
    <section className="member-panel preference-panel" aria-label={`Objetivos nutricionais de ${member.name}`}>
      <p className="muted preference-note">
        Os valores são de {member.name}. Servem para comparar o que se come com o que a pessoa quer; o que ficar em
        branco usa a dose de referência europeia.
      </p>

      {!values && !error && <p className="muted loading">A carregar…</p>}

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
              Guardado.
            </p>
          )}
          <div className="button-row member-form-wide">
            {canEdit && (
              <button type="submit" className="button-primary" disabled={busy}>
                {busy ? "A guardar…" : "Guardar"}
              </button>
            )}
            {canEdit && isSet && (
              <button type="button" className="button-danger" onClick={handleClear} disabled={busy}>
                Apagar objetivos
              </button>
            )}
            <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
              Fechar
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
              Fechar
            </button>
          </div>
        </>
      )}
    </section>
  );
}
