import { useState } from "react";
import type { MealPlanTemplateEntryDto } from "../api/mealPlanTemplates";
import { MealType, mealTypeLabels, mealTypes } from "../api/planning";
import { dishTypeLabels, type DishType } from "../api/types";
import { RecipePicker } from "./RecipePicker";

/** Uma refeição do dia enquanto se edita. `entry` = a original, para manter doses e notas. */
export interface DayRow {
  key: string;
  mealType: MealType;
  recipeId: string;
  recipeTitle: string;
  dishType: DishType | null;
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
      entry,
    })),
  );
  // Linha cuja receita se está a escolher; "new" = refeição nova.
  const [picking, setPicking] = useState<string | null>(null);

  function update(key: string, change: Partial<DayRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));
  }

  const pickingRow = rows.find((row) => row.key === picking) ?? null;

  return (
    <div className="day-editor">
      <h3 className="day-title">Dia {dayIndex}</h3>
      {rows.length === 0 && <p className="muted day-empty">Sem refeições.</p>}
      <ul className="day-editor-rows">
        {rows.map((row) => (
          <li key={row.key}>
            <select
              className="category-select"
              aria-label={`Refeição de ${row.recipeTitle}`}
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
            </span>
            <span className="day-editor-actions">
              <button type="button" className="link-button" onClick={() => setPicking(row.key)}>
                Trocar receita
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
              >
                Remover
              </button>
            </span>
          </li>
        ))}
      </ul>

      {picking !== null ? (
        <RecipePicker
          defaultDishType={pickingRow?.dishType ?? null}
          onCancel={() => setPicking(null)}
          onPick={(recipe) => {
            if (pickingRow) {
              update(pickingRow.key, { recipeId: recipe.recipeId, recipeTitle: recipe.title, dishType: recipe.dishType });
            } else {
              setRows((current) => [
                ...current,
                {
                  key: `new-${nextKey++}`,
                  mealType: MealType.Dinner,
                  recipeId: recipe.recipeId,
                  recipeTitle: recipe.title,
                  dishType: recipe.dishType,
                  entry: null,
                },
              ]);
            }
            setPicking(null);
          }}
        />
      ) : (
        <button type="button" className="link-button" onClick={() => setPicking("new")}>
          + Acrescentar refeição
        </button>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="button" className="button-primary" disabled={saving || picking !== null} onClick={() => onSave(rows)}>
          {saving ? "A guardar…" : "Guardar dia"}
        </button>
        <button type="button" className="button-secondary" disabled={saving} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
