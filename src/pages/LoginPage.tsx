import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { signIn } from "../auth/actions";
import { describeError } from "../auth/errors";
import { safeNextPath } from "../auth/links";
import { useSession } from "../auth/useSession";

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const notice = (location.state as { notice?: string } | null)?.notice;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session && !submitting) {
    return <Navigate to={next} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(describeError(err, { "invalid-credentials": "Email ou password errados." }));
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <p className="eyebrow">Conta</p>
      <h1>Entrar</h1>
      {notice && <p className="notice">{notice}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? "A entrar…" : "Entrar"}
        </button>
      </form>

      <p className="form-links">
        <Link to="/esqueci-password">Esqueci-me da password</Link>
        <span className="muted">·</span>
        <Link to="/registar">Criar conta</Link>
      </p>
    </div>
  );
}
