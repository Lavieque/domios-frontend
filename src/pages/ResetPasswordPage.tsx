import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, resetPassword } from "../api/auth";
import { ApiError } from "../api/http";
import { describeError } from "../auth/errors";
import { tokenFromHash } from "../auth/links";
import { sessionStore } from "../auth/sessionStore";

const WEAK_PASSWORD = `A password tem de ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;

/** Destino do link do email `{Frontend:BaseUrl}/reset-password#token=...` (caminho fixado pela Api). */
export function ResetPasswordPage() {
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
      setError("As duas passwords não são iguais.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token!, password);
      // A Api termina todas as sessões do utilizador, incluindo a deste browser.
      sessionStore.clear();
      navigate("/entrar", { replace: true, state: { notice: "Password alterada. Entra com a password nova." } });
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
    <div className="page auth-page">
      <p className="eyebrow">Conta</p>
      <h1>Definir password nova</h1>

      {linkInvalid ? (
        <>
          <p className="form-error" role="alert">
            Este link já foi usado, expirou ou foi substituído por um mais recente.
          </p>
          <p className="form-links">
            <Link to="/esqueci-password">Pedir um link novo</Link>
          </p>
        </>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Password nova</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="muted">
              Entre {PASSWORD_MIN_LENGTH} e {PASSWORD_MAX_LENGTH} caracteres. Ao mudar, sais da conta em todos os
              dispositivos.
            </small>
          </label>
          <label className="form-field">
            <span>Repetir password nova</span>
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
            {submitting ? "A guardar…" : "Guardar password"}
          </button>
        </form>
      )}
    </div>
  );
}
