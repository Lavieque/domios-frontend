import { useState, type FormEvent } from "react";
import { admin, type CatalogIngredient } from "../api";
import { ConfirmAction, Pager, State } from "../components";
import { EditForm, Field } from "../fields";
import { UNITS, splitList, unitLabel } from "../values";
import { describe, useLoad } from "../hooks";

const FILTERS = [
  { value: "Active", label: "Ativos" },
  { value: "Archived", label: "Arquivados" },
  { value: "", label: "Todos" },
] as const;

export function IngredientsSection() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("Active");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const list = useLoad(() => admin.ingredients(search, status, page), [search, status, page]);
  const items = list.data?.items ?? [];

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch(draft.trim());
    setPage(1);
  }

  return (
    <>
      <div className="toolbar">
        <form className="search" onSubmit={submit} role="search">
          <input type="search" aria-label="Procurar ingredientes" placeholder="Procurar por nome…" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="button-secondary">
            Procurar
          </button>
        </form>
        <button type="button" className="button-primary" onClick={() => setCreating(true)} disabled={creating}>
          Novo ingrediente
        </button>
      </div>
      <div className="chip-row" role="group" aria-label="Estado do ingrediente">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className="chip"
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      {creating && (
        <div className="panel">
          <h2>Novo ingrediente</h2>
          <IngredientForm
            onSaved={() => {
              setCreating(false);
              list.reload();
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}
      {list.data && <p className="count">{list.data.total} ingredientes</p>}
      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem ingredientes." />
      {items.length > 0 && (
        <ul className="rows">
          {items.map((i) => (
            <IngredientRow key={i.ingredientId} ingredient={i} onChanged={list.reload} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function IngredientRow({ ingredient: i, onChanged }: { ingredient: CatalogIngredient; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="row row-edit">
        <IngredientForm
          ingredient={i}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{i.displayName ?? i.name}</strong>
          {i.displayName && <span className="muted">{i.name}</span>}
        </div>
        <p className="row-meta">
          {unitLabel(i.defaultUnit)}
          {i.allergens.length > 0 && <> · {i.allergens.join(", ")}</>}
          {i.canonicalIngredientId && " · variante de outro ingrediente"}
        </p>
      </div>
      <div className="row-state">
        <span className={`pill ${i.status === 0 ? "pill-good" : "pill-muted"}`}>{i.status === 0 ? "Ativo" : "Arquivado"}</span>
      </div>
      <div className="row-actions">
        <button type="button" className="row-action" onClick={() => setEditing(true)}>
          Editar
        </button>
        {i.status === 0 && (
          <ConfirmAction
            label="Arquivar"
            confirmLabel="Arquivar ingrediente"
            tone="danger"
            onConfirm={async () => {
              await admin.archiveIngredient(i.ingredientId);
              onChanged();
            }}
          />
        )}
      </div>
    </li>
  );
}

function IngredientForm({ ingredient, onSaved, onCancel }: { ingredient?: CatalogIngredient; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [unit, setUnit] = useState(ingredient?.defaultUnit ?? 1);
  const [allergens, setAllergens] = useState((ingredient?.allergens ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body = { name: name.trim(), defaultUnit: unit, allergens: splitList(allergens) };
      if (ingredient) await admin.updateIngredient(ingredient.ingredientId, body);
      else await admin.createIngredient(body);
      onSaved();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <EditForm busy={busy} error={error} submitLabel={ingredient ? "Guardar" : "Criar ingrediente"} onCancel={onCancel} onSubmit={save}>
      <Field label="Nome">
        <input type="text" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Unidade por defeito">
        <select value={unit} onChange={(e) => setUnit(Number(e.target.value))}>
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Alergénios" wide hint="Separados por vírgula.">
        <input type="text" value={allergens} onChange={(e) => setAllergens(e.target.value)} />
      </Field>
    </EditForm>
  );
}
