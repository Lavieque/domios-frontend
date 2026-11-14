import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { describeError } from "../auth/errors";
import { AuthSheet } from "../components/AuthSheet";
import { useT } from "../i18n";

export function ForgotPasswordPage() {
  const t = useT();
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
      setError(describeError(err, { "invalid-argument": t.auth.invalidEmail }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSheet title={t.auth.recoverTitle}>
      {sentTo ? (
        // A Api responde igual exista ou não a conta: a mensagem também.
        <p className="notice">
          {t.auth.resetSentBefore} <strong>{sentTo}</strong>
          {t.auth.resetSentAfter}
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <p className="muted">{t.auth.recoverIntro}</p>
          <label className="form-field">
            <span>{t.common.email}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? t.common.sending : t.auth.sendLink}
          </button>
        </form>
      )}

      <p className="form-links">
        <Link to="/entrar">{t.auth.backToSignIn}</Link>
      </p>
    </AuthSheet>
  );
}
