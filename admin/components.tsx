import { useState, type ReactNode } from "react";
import { describe } from "./hooks";

/** Ação com confirmação inline em dois passos: a primeira vez pede, a segunda executa. */
export function ConfirmAction({
  label,
  confirmLabel,
  onConfirm,
  tone = "neutral",
  disabled = false,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  tone?: "neutral" | "danger";
  disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setAsking(false);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <button type="button" className={tone === "danger" ? "button-danger" : "row-action"} disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="confirm">
      <button type="button" className={tone === "danger" ? "button-danger is-armed" : "row-action is-armed"} disabled={busy} onClick={run}>
        {busy ? "A fazer…" : confirmLabel}
      </button>
      <button type="button" className="link-button" disabled={busy} onClick={() => setAsking(false)}>
        Cancelar
      </button>
      {error && (
        <span className="inline-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Páginas">
      <button type="button" className="button-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </button>
      <span className="muted">
        Página {page} de {pages}
      </span>
      <button type="button" className="button-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Seguinte
      </button>
    </nav>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

export function State({ loading, error, empty, emptyText }: { loading: boolean; error: string | null; empty: boolean; emptyText: string }) {
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (loading && empty) return <p className="muted">A carregar…</p>;
  if (empty) return <p className="muted empty">{emptyText}</p>;
  return null;
}
