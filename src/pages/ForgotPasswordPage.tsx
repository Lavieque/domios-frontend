import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { describeError } from "../auth/errors";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(describeError(err, { "invalid-argument": "Indica um email válido." }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <h1>Recuperar password</h1>

      {sentTo ? (
        // A Api responde igual exista ou não a conta: a mensagem também.
        <p className="notice">
          Se existir uma conta com <strong>{sentTo}</strong>, vais receber um email com um link para definires uma
          password nova. O link é válido durante 30 minutos.
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <p className="muted">Indica o email da tua conta e enviamos-te um link para definires uma password nova.</p>
          <label className="form-field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "A enviar…" : "Enviar link"}
          </button>
        </form>
      )}

      <p className="form-links">
        <Link to="/entrar">Voltar a entrar</Link>
      </p>
    </div>
  );
}
