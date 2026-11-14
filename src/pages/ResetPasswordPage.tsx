import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, resetPassword } from "../api/auth";
import { ApiError } from "../api/http";
import { describeError } from "../auth/errors";
import { AuthSheet } from "../components/AuthSheet";
import { tokenFromHash } from "../auth/links";
import { sessionStore } from "../auth/sessionStore";
import { useT } from "../i18n";

/** Destino do link do email `{Frontend:BaseUrl}/reset-password#token=...` (caminho fixado pela Api). */
export function ResetPasswordPage() {
  const t = useT();
  const WEAK_PASSWORD = t.auth.weakPassword(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH);
  const navigate = useNavigate();
  const hashToken = tokenFromHash(useLocation().hash);
  const [token, setToken] = useState(hashToken);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(!hashToken);
  const [submitting, setSubmitting] = useState(false);

  // Guarda o token e tira-o da barra de endereço (não fica no histórico).
  useEffect(() => {
    if (!hashToken) return;
    setToken(hashToken);
    setLinkInvalid(false);
    navigate({ hash: "" }, { replace: true });
  }, [hashToken, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setError(WEAK_PASSWORD);
      return;
    }
    if (password !== confirmation) {
      setError(t.auth.passwordsDiffer);
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token!, password);
      // A Api termina todas as sessões do utilizador, incluindo a deste browser.
      sessionStore.clear();
      navigate("/entrar", {
        replace: true,
        state: { notice: t.auth.passwordChanged },
      });
    } catch (err) {
      if (err instanceof ApiError && err.type === "invalid-token") {
        setLinkInvalid(true);
      } else {
        // weak-password não gasta o link: pode corrigir e tentar de novo.
        setError(describeError(err, { "weak-password": WEAK_PASSWORD }));
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthSheet title={t.auth.newPasswordTitle}>
      {linkInvalid ? (
        <>
          <p className="form-error" role="alert">
            {t.auth.linkInvalid}
          </p>
          <p className="form-links">
            <Link to="/esqueci-password">{t.auth.requestNewLink}</Link>
          </p>
        </>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>{t.auth.newPassword}</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="muted">
              {t.auth.passwordLength(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)} {t.auth.signsOutEverywhere}
            </small>
          </label>
          <label className="form-field">
            <span>{t.auth.repeatNewPassword}</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? t.common.saving : t.auth.savePassword}
          </button>
        </form>
      )}
    </AuthSheet>
  );
}
