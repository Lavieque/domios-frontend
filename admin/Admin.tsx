import { useState, type FormEvent } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { ApiError, login, logout } from "./api";
import { describe, useSession } from "./hooks";
import { AuditPage } from "./pages/AuditPage";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage";
import { HouseholdsPage } from "./pages/HouseholdsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SystemPage } from "./pages/SystemPage";
import { UsersPage } from "./pages/UsersPage";

function Brand() {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 120 120" aria-hidden="true">
        <polyline points="30,72 30,46 60,20 90,46 90,72" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="52,88 52,62 82,36 112,62 112,88" fill="none" stroke="var(--accent-2)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="wordmark">
        Domi<em>OS</em>
      </span>
      <span className="brand-tag">Admin</span>
    </span>
  );
}

export function Admin() {
  const session = useSession();
  if (!session) return <LoginPage />;

  return (
    <div className="admin">
      <header className="admin-header">
        <Brand />
        <nav className="admin-nav" aria-label="Principal">
          <NavLink to="/pedidos">Pedidos</NavLink>
          <NavLink to="/utilizadores">Utilizadores</NavLink>
          <NavLink to="/casas">Casas</NavLink>
          <NavLink to="/sistema">Sistema</NavLink>
          <NavLink to="/auditoria">Auditoria</NavLink>
        </nav>
        <div className="admin-user">
          <span className="muted admin-email" title={session.email}>
            {session.email}
          </span>
          <button type="button" className="button-secondary" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>
      <main className="admin-main">
        <Routes>
          <Route path="/" element={<Navigate to="/pedidos" replace />} />
          <Route path="/entrar" element={<Navigate to="/pedidos" replace />} />
          <Route path="/pedidos" element={<RequestsPage />} />
          <Route path="/utilizadores" element={<UsersPage selfId={session.userId} />} />
          <Route path="/casas" element={<HouseholdsPage />} />
          <Route path="/casas/:id" element={<HouseholdDetailPage />} />
          <Route path="/sistema" element={<SystemPage />} />
          <Route path="/auditoria" element={<AuditPage />} />
          <Route path="*" element={<p className="muted">Esta página não existe.</p>} />
        </Routes>
      </main>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email ou password errados."
          : err instanceof ApiError && err.type === "not-admin"
            ? err.message
            : describe(err),
      );
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <Brand />
      <h1>Entrar</h1>
      <p className="page-sub">Administração da plataforma. Só para contas de administrador.</p>
      <form className="login-form" onSubmit={submit}>
        <label className="form-field">
          <span>Email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
