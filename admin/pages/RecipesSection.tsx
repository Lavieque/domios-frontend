import { useState, type FormEvent } from "react";
import { admin, type NewRecipe, type RecipeDetail, type RecipeSummary } from "../api";
import { ConfirmAction, Pager, State } from "../components";
import { EditForm, Field } from "../fields";
import { UNITS, splitList, toNumber, unitLabel } from "../values";
import { describe, useLoad } from "../hooks";

const STATUS: Record<number, { label: string; pill: string }> = {
  0: { label: "Rascunho", pill: "pill-navy" },
  1: { label: "Publicada", pill: "pill-good" },
  2: { label: "Arquivada", pill: "pill-muted" },
};

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "Draft", label: "Rascunhos" },
  { value: "Published", label: "Publicadas" },
  { value: "Archived", label: "Arquivadas" },
] as const;

const DIFFICULTY = ["Fácil", "Média", "Difícil"];

export function RecipesSection() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const list = useLoad(() => admin.recipes(search, status, page), [search, status, page]);
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
          <input type="search" aria-label="Procurar receitas" placeholder="Procurar por título…" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="button-secondary">
            Procurar
          </button>
        </form>
        <button type="button" className="button-primary" onClick={() => setCreating(true)} disabled={creating}>
          Nova receita
        </button>
      </div>
      <div className="chip-row" role="group" aria-label="Estado da receita">
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
          <h2>Nova receita</h2>
          <p className="muted">Fica em rascunho. Junta ingredientes e passos, e só depois publica.</p>
          <RecipeForm
            onSaved={() => {
              setCreating(false);
              list.reload();
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}
      {list.data && <p className="count">Receitas do catálogo: {list.data.total}</p>}
      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem receitas." />
      {items.length > 0 && (
        <ul className="rows">
          {items.map((r) => (
            <RecipeRow key={r.recipeId} recipe={r} onChanged={list.reload} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function RecipeRow({ recipe: r, onChanged }: { recipe: RecipeSummary; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const status = STATUS[r.status] ?? { label: String(r.status), pill: "pill-muted" };

  return (
    <li className={open ? "row row-edit" : "row"}>
      {open ? (
        <RecipeEditor
          id={r.recipeId}
          onClose={() => {
            setOpen(false);
            onChanged();
          }}
        />
      ) : (
        <>
          <div className="row-main">
            <div className="row-title">
              <strong>{r.title}</strong>
              <span className="muted">{DIFFICULTY[r.difficulty] ?? ""}</span>
            </div>
            {r.tags.length > 0 && <p className="row-meta">{r.tags.join(" · ")}</p>}
          </div>
          <div className="row-state">
            <span className={`pill ${status.pill}`}>{status.label}</span>
          </div>
          <div className="row-actions">
            <button type="button" className="row-action" onClick={() => setOpen(true)}>
              Abrir
            </button>
            {r.status === 0 && (
              <ConfirmAction
                label="Publicar"
                confirmLabel="Publicar receita"
                onConfirm={async () => {
                  await admin.publishRecipe(r.recipeId);
                  onChanged();
                }}
              />
            )}
            {r.status !== 2 && (
              <ConfirmAction
                label="Arquivar"
                confirmLabel="Arquivar receita"
                tone="danger"
                onConfirm={async () => {
                  await admin.archiveRecipe(r.recipeId);
                  onChanged();
                }}
              />
            )}
          </div>
        </>
      )}
    </li>
  );
}

/** Receita aberta: dados, ingredientes e passos no mesmo sítio. */
function RecipeEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const load = useLoad(() => admin.recipe(id), [id]);
  const recipe = load.data;

  return (
    <div className="editor">
      <State loading={load.loading} error={load.error} empty={!recipe} emptyText="Receita não encontrada." />
      {recipe && (
        <>
          <h2>{recipe.title}</h2>
          <RecipeForm recipe={recipe} onSaved={load.reload} onCancel={onClose} cancelLabel="Fechar" />
          <h3>Ingredientes</h3>
          <RecipeIngredients recipe={recipe} onChanged={load.reload} />
          <h3>Passos</h3>
          <RecipeSteps recipe={recipe} onChanged={load.reload} />
        </>
      )}
      {!recipe && (
        <button type="button" className="button-secondary" onClick={onClose}>
          Fechar
        </button>
      )}
    </div>
  );
}

function RecipeForm({
  recipe,
  onSaved,
  onCancel,
  cancelLabel,
}: {
  recipe?: RecipeDetail;
  onSaved: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(String(recipe?.servings ?? 4));
  const [difficulty, setDifficulty] = useState(recipe?.difficulty ?? 0);
  const [prep, setPrep] = useState(recipe?.prepTimeMinutes == null ? "" : String(recipe.prepTimeMinutes));
  const [cook, setCook] = useState(recipe?.cookTimeMinutes == null ? "" : String(recipe.cookTimeMinutes));
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? "");
  const [tags, setTags] = useState((recipe?.tags ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    const portions = toNumber(servings);
    if (portions === undefined || !Number.isInteger(portions) || portions < 1) return setError("As doses têm de ser um número inteiro, 1 ou mais.");

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      if (recipe) {
        await admin.updateRecipe(recipe.recipeId, {
          title: title.trim(),
          description: description.trim(),
          servings: portions,
          difficulty,
          imageUrl: imageUrl.trim(),
          tags: splitList(tags),
        });
        setSaved(true);
      } else {
        const body: NewRecipe = {
          title: title.trim(),
          servings: portions,
          difficulty,
          description: description.trim() || null,
          prepTimeMinutes: toNumber(prep) ?? null,
          cookTimeMinutes: toNumber(cook) ?? null,
          imageUrl: imageUrl.trim() || null,
          tags: splitList(tags),
        };
        await admin.createRecipe(body);
      }
      onSaved();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <EditForm busy={busy} error={error} submitLabel={recipe ? "Guardar" : "Criar receita"} onCancel={onCancel} cancelLabel={cancelLabel} onSubmit={save}>
        <Field label="Título" wide>
          <input type="text" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Doses">
          <input type="text" inputMode="numeric" required value={servings} onChange={(e) => setServings(e.target.value)} />
        </Field>
        <Field label="Dificuldade">
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
            {DIFFICULTY.map((label, value) => (
              <option key={label} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {!recipe && (
          <>
            <Field label="Preparação (minutos)">
              <input type="text" inputMode="numeric" value={prep} onChange={(e) => setPrep(e.target.value)} />
            </Field>
            <Field label="Cozedura (minutos)">
              <input type="text" inputMode="numeric" value={cook} onChange={(e) => setCook(e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Descrição" wide>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Imagem (endereço)">
          <input type="text" inputMode="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </Field>
        <Field label="Etiquetas" hint="Separadas por vírgula.">
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </EditForm>
      {saved && <p className="saved" role="status">Guardado.</p>}
    </>
  );
}

function RecipeIngredients({ recipe, onChanged }: { recipe: RecipeDetail; onChanged: () => void }) {
  const [search, setSearch] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState(1);
  const [notes, setNotes] = useState("");
  const [optional, setOptional] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = useLoad(() => (search.trim().length >= 2 ? admin.ingredients(search.trim(), "Active", 1) : Promise.resolve(null)), [search]);

  async function add(event: FormEvent) {
    event.preventDefault();
    const quantity = toNumber(amount);
    if (!ingredientId) return setError("Escolhe um ingrediente.");
    if (quantity === undefined || quantity <= 0) return setError("Indica a quantidade (maior que zero).");
    setBusy(true);
    setError(null);
    try {
      await admin.addRecipeIngredient(recipe.recipeId, { ingredientId, quantity: { amount: quantity, unit }, notes: notes.trim() || null, isOptional: optional });
      setIngredientId("");
      setAmount("");
      setNotes("");
      setOptional(false);
      onChanged();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {recipe.ingredients.length === 0 ? (
        <p className="muted">Sem ingredientes.</p>
      ) : (
        <ul className="rows">
          {recipe.ingredients.map((i) => (
            <li key={i.recipeIngredientId} className="row row-slim">
              <div className="row-main">
                <div className="row-title">
                  <strong>{i.ingredientName}</strong>
                  <span className="muted">
                    {i.quantity.amount} {unitLabel(i.quantity.unit)}
                    {i.isOptional && " · opcional"}
                  </span>
                </div>
                {i.notes && <p className="row-meta">{i.notes}</p>}
              </div>
              <div />
              <div className="row-actions">
                <ConfirmAction
                  label="Tirar"
                  confirmLabel="Tirar ingrediente"
                  tone="danger"
                  onConfirm={async () => {
                    await admin.removeRecipeIngredient(recipe.recipeId, i.recipeIngredientId);
                    onChanged();
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="add-line" onSubmit={add}>
        <Field label="Procurar ingrediente">
          <input type="search" value={search} placeholder="Pelo menos 2 letras" onChange={(e) => setSearch(e.target.value)} />
        </Field>
        <Field label="Ingrediente">
          <select value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
            <option value="">{options.data ? (options.data.items.length ? "Escolher…" : "Nenhum resultado") : "Procura primeiro"}</option>
            {(options.data?.items ?? []).map((o) => (
              <option key={o.ingredientId} value={o.ingredientId}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantidade">
          <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Unidade">
          <select value={unit} onChange={(e) => setUnit(Number(e.target.value))}>
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nota">
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
          Opcional
        </label>
        <button type="submit" className="button-secondary" disabled={busy}>
          {busy ? "A juntar…" : "Juntar"}
        </button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}

function RecipeSteps({ recipe, onChanged }: { recipe: RecipeDetail; onChanged: () => void }) {
  const [instruction, setInstruction] = useState("");
  const [minutes, setMinutes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await admin.addRecipeStep(recipe.recipeId, { instruction: instruction.trim(), durationMinutes: toNumber(minutes) ?? null });
      setInstruction("");
      setMinutes("");
      onChanged();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {recipe.steps.length === 0 ? (
        <p className="muted">Sem passos.</p>
      ) : (
        <ol className="rows steps">
          {[...recipe.steps]
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((s) => (
              <li key={s.recipeStepId} className="row row-slim">
                <div className="row-main">
                  <p className="step-text">
                    <strong>{s.stepNumber}.</strong> {s.instruction}
                  </p>
                  {s.durationMinutes != null && <p className="row-meta">{s.durationMinutes} min</p>}
                </div>
                <div />
                <div className="row-actions">
                  <ConfirmAction
                    label="Tirar"
                    confirmLabel="Tirar passo"
                    tone="danger"
                    onConfirm={async () => {
                      await admin.removeRecipeStep(recipe.recipeId, s.recipeStepId);
                      onChanged();
                    }}
                  />
                </div>
              </li>
            ))}
        </ol>
      )}
      <form className="add-line" onSubmit={add}>
        <Field label="Novo passo" wide>
          <textarea rows={2} required value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </Field>
        <Field label="Minutos">
          <input type="text" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </Field>
        <button type="submit" className="button-secondary" disabled={busy || !instruction.trim()}>
          {busy ? "A juntar…" : "Juntar passo"}
        </button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}
