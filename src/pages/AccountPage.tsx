import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { memberRoleLabels } from "../api/households";
import { signOut, signOutEverywhere } from "../auth/actions";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import { EmailVerificationNotice } from "../components/EmailVerificationNotice";
import { useHouseholds } from "../household/useHouseholds";

export function AccountPage() {
  // Rota dentro de <RequireAuth>: há sempre sessão ao renderizar.
  const session = useSession()!;
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const households = useHouseholds();

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
    <div className="page settings-page">
      <h1>A tua conta</h1>
      <p className="page-sub">O teu acesso ao DomiOS e as casas de que fazes parte.</p>
      {notice && <p className="notice">{notice}</p>}

      <dl className="settings-list">
        <div className="settings-row">
          <dt>Email</dt>
          <dd>
            <span className="settings-value">{session.email}</span>
            {session.emailVerified ? (
              <span className="pill pill-good">Confirmado</span>
            ) : (
              <span className="pill pill-warning">Por confirmar</span>
            )}
          </dd>
        </div>
        <div className="settings-row">
          <dt>Password</dt>
          <dd>
            <span className="muted">Para mudar, enviamos-te um link para o email.</span>
            <Link to="/esqueci-password" className="settings-action">
              Pedir link
            </Link>
          </dd>
        </div>
      </dl>
      {!session.emailVerified && <EmailVerificationNotice />}

      <div className="section-head">
        <h2>As tuas casas</h2>
        <Link to="/casa/nova">Criar casa</Link>
      </div>
      {households.loading ? (
        <p className="muted loading">A carregar…</p>
      ) : households.error ? (
        <p className="form-error" role="alert">
          {households.error}
        </p>
      ) : households.households.length === 0 ? (
        <p className="empty-state">
          Ainda não fazes parte de nenhuma casa. <Link to="/casa/nova">Cria a tua</Link>.
        </p>
      ) : (
        <ul className="settings-list">
          {households.households.map((h) => {
            const isCurrent = h.householdId === households.current?.householdId;
            return (
              <li key={h.householdId} className="settings-row">
                <span className="settings-row-title">
                  {h.name}
                  {isCurrent && <span className="pill pill-good">Neste browser</span>}
                </span>
                <span className="settings-row-end">
                  <span className="muted">{memberRoleLabels[h.role]}</span>
                  {isCurrent ? (
                    <Link to="/casa" className="settings-action">
                      Gerir
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => {
                        households.select(h.householdId);
                        navigate("/casa");
                      }}
                    >
                      Usar esta casa
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <h2>Sessão</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul className="settings-list">
        <li className="settings-row">
          <span className="settings-row-title">
            Este browser
            <small className="muted">Sais aqui; os outros dispositivos continuam com sessão.</small>
          </span>
          <button type="button" className="button-secondary" onClick={handleSignOut} disabled={busy}>
            Sair
          </button>
        </li>
        <li className="settings-row">
          <span className="settings-row-title">
            Todos os dispositivos
            <small className="muted">Termina todas as sessões, incluindo esta. Útil se perdeste um telemóvel.</small>
          </span>
          <button type="button" className="button-danger" onClick={handleSignOutEverywhere} disabled={busy}>
            {busy ? "A sair…" : "Sair em todos"}
          </button>
        </li>
      </ul>
    </div>
  );
}
