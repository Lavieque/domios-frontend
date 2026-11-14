import { useEffect, useRef, useState } from "react";
import type { MealPlanTemplateEntryDto } from "../api/mealPlanTemplates";
import { MealType, mealTypeLabels, mealTypes } from "../api/planning";
import { dishTypeLabels, RecipeStatus, type DishType } from "../api/types";
import { RecipePicker } from "./RecipePicker";
import { tr } from "../i18n";

/** Uma refeição do dia enquanto se edita. `entry` = a original, para manter doses e notas. */
export interface DayRow {
  key: string;
  mealType: MealType;
  recipeId: string;
  recipeTitle: string;
  dishType: DishType | null;
  /** Receita que deixou de estar publicada: diz-se na linha, para se saber qual trocar. */
  unavailable: boolean;
  entry: MealPlanTemplateEntryDto | null;
}

interface Props {
  dayIndex: number;
  entries: MealPlanTemplateEntryDto[];
  saving: boolean;
  error: string | null;
  onSave: (rows: DayRow[]) => void;
  onCancel: () => void;
}

let nextKey = 0;

/** Editar um dia da ementa: trocar a receita ou a refeição, remover, acrescentar. */
export function TemplateDayEditor({ dayIndex, entries, saving, error, onSave, onCancel }: Props) {
  const [rows, setRows] = useState<DayRow[]>(() =>
    entries.map((entry) => ({
      key: entry.mealPlanTemplateEntryId,
      mealType: entry.mealType,
      recipeId: entry.recipeId,
      recipeTitle: entry.recipeTitle,
      dishType: entry.dishType,
      unavailable: entry.recipeStatus !== RecipeStatus.Published,
      entry,
    })),
  );
  // Linha cuja receita se está a escolher; "new" = refeição nova.
  const [picking, setPicking] = useState<string | null>(null);
  // Para onde vai o foco depois de uma mudança que tira o botão carregado do ecrã.
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Ao abrir, o foco entra no editor.
  useEffect(() => {
    root.current?.focus();
  }, []);

  useEffect(() => {
    if (focusTarget === null) return;
    root.current?.querySelector<HTMLElement>(`[data-focus="${focusTarget}"]`)?.focus();
    setFocusTarget(null);
  }, [focusTarget, rows, picking]);

  function update(key: string, change: Partial<DayRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));
  }

  function remove(key: string) {
    const index = rows.findIndex((row) => row.key === key);
    const next = rows[index + 1] ?? rows[index - 1];
    setRows((current) => current.filter((row) => row.key !== key));
    setFocusTarget(next ? `meal-${next.key}` : "add");
  }

  function closePicker() {
    setFocusTarget(picking === "new" ? "add" : `swap-${picking}`);
    setPicking(null);
  }

  const pickingRow = rows.find((row) => row.key === picking) ?? null;

  return (
    <div className="day-editor" role="group" aria-label={tr().ui.dayEditor.editDay(dayIndex)} tabIndex={-1} ref={root}>
      {rows.length === 0 && <p className="muted day-empty">{tr().ui.dayEditor.noMeals}</p>}
      <ul className="day-editor-rows">
        {rows.map((row) => (
          <li key={row.key}>
            <select
              className="category-select"
              aria-label={tr().ui.dayEditor.mealOf(row.recipeTitle)}
              data-focus={`meal-${row.key}`}
              value={row.mealType}
              onChange={(e) => update(row.key, { mealType: Number(e.target.value) as MealType })}
            >
              {mealTypes.map((type) => (
                <option key={type} value={type}>
                  {mealTypeLabels[type]}
                </option>
              ))}
            </select>
            <span className="day-editor-title">
              {row.recipeTitle}
              {row.dishType !== null && <span className="muted"> · {dishTypeLabels[row.dishType]}</span>}
              {row.unavailable && <span className="day-editor-unavailable">{tr().ui.dayEditor.unavailable}</span>}
            </span>
            <span className="day-editor-actions">
              <button
                type="button"
                className="link-button"
                aria-label={tr().ui.dayEditor.swapLabel(row.recipeTitle)}
                data-focus={`swap-${row.key}`}
                onClick={() => setPicking(row.key)}
              >
                {tr().ui.dayEditor.swap}
              </button>
              <button
                type="button"
                className="link-button"
                aria-label={tr().ui.dayEditor.removeLabel(row.recipeTitle)}
                onClick={() => remove(row.key)}
              >
                {tr().common.remove}
              </button>
            </span>
          </li>
        ))}
      </ul>

      {picking !== null ? (
        <RecipePicker
          label={pickingRow ? tr().ui.dayEditor.swapFor(pickingRow.recipeTitle) : tr().ui.dayEditor.addToDay(dayIndex)}
          defaultDishType={pickingRow?.dishType ?? null}
          onCancel={closePicker}
          onPick={(recipe) => {
            if (pickingRow) {
              update(pickingRow.key, {
                recipeId: recipe.recipeId,
                recipeTitle: recipe.title,
                dishType: recipe.dishType,
                unavailable: false,
              });
              setFocusTarget(`swap-${pickingRow.key}`);
            } else {
              const key = `new-${nextKey++}`;
              setRows((current) => [
                ...current,
                {
                  key,
                  mealType: MealType.Dinner,
                  recipeId: recipe.recipeId,
                  recipeTitle: recipe.title,
                  dishType: recipe.dishType,
                  unavailable: false,
                  entry: null,
                },
              ]);
              setFocusTarget(`meal-${key}`);
            }
            setPicking(null);
          }}
        />
      ) : (
        <button type="button" className="link-button" data-focus="add" onClick={() => setPicking("new")}>
          {tr().ui.dayEditor.addMeal}
        </button>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="button" className="button-primary" disabled={saving || picking !== null} onClick={() => onSave(rows)}>
          {saving ? tr().common.saving : tr().ui.dayEditor.saveDay}
        </button>
        <button type="button" className="button-secondary" disabled={saving} onClick={onCancel}>
          {tr().common.cancel}
        </button>
      </div>
    </div>
  );
}
