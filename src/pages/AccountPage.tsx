import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut, signOutEverywhere } from "../auth/actions";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import { EmailVerificationNotice } from "../components/EmailVerificationNotice";

export function AccountPage() {
  // Rota dentro de <RequireAuth>: há sempre sessão ao renderizar.
  const session = useSession()!;
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/entrar", { replace: true, state: { notice: "Saíste da conta." } });
  }

  async function handleSignOutEverywhere() {
    setError(null);
    setBusy(true);
    try {
      await signOutEverywhere();
      navigate("/entrar", { replace: true, state: { notice: "Saíste da conta em todos os dispositivos." } });
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  return (
    <div className="page auth-page">
      <h1>A tua conta</h1>
      {notice && <p className="notice">{notice}</p>}

      <div className="meta-grid">
        <div className="meta-field">
          <div className="meta-field-label">Email</div>
          <div className="meta-field-value">{session.email}</div>
        </div>
        <div className="meta-field">
          <div className="meta-field-label">Estado</div>
          <div className="meta-field-value">{session.emailVerified ? "Email confirmado" : "Email por confirmar"}</div>
        </div>
      </div>

      {!session.emailVerified && <EmailVerificationNotice />}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="button-row">
        <button type="button" className="button-primary" onClick={handleSignOut} disabled={busy}>
          Sair
        </button>
        <button type="button" className="button-secondary" onClick={handleSignOutEverywhere} disabled={busy}>
          Sair em todos os dispositivos
        </button>
      </div>
    </div>
  );
}
