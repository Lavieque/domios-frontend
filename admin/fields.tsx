import type { ReactNode } from "react";

/** Rótulo e controlo juntos; `wide` ocupa a linha inteira da grelha do formulário. */
export function Field({ label, wide = false, hint, children }: { label: string; wide?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className={wide ? "edit-field edit-field-wide" : "edit-field"}>
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export function EditForm({
  busy,
  error,
  submitLabel,
  cancelLabel = "Cancelar",
  onCancel,
  onSubmit,
  children,
}: {
  busy: boolean;
  error: string | null;
  submitLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <form
      className="edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="edit-grid">{children}</div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="edit-actions">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "A guardar…" : submitLabel}
        </button>
        <button type="button" className="button-secondary" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </form>
  );
}
