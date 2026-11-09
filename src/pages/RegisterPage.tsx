import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, register } from "../api/auth";
import { ApiError } from "../api/http";
import { signIn } from "../auth/actions";
import { describeError } from "../auth/errors";
import { AuthSheet } from "../components/AuthSheet";
import { inviteFromHash } from "../auth/links";
import { useSession } from "../auth/useSession";
import { REQUEST_ACCESS_URL } from "../siteUrl";

const WEAK_PASSWORD = `A password tem de ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;
const INVALID_INVITE =
  "Este convite não é válido: expirou, já foi usado ou é de outro email. Pede acesso de novo ou usa o email para onde o convite foi enviado.";

export function RegisterPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  // O convite vem no fragmento do link do email. Lembra-se o último visto:
  // sobrevive a um re-render mesmo que o fragmento desapareça do URL.
  const inviteRef = useRef<string | null>(null);
  const hashInvite = inviteFromHash(location.hash);
  if (hashInvite) inviteRef.current = hashInvite;
  const invite = inviteRef.current;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (session && !submitting) {
    return <Navigate to="/conta" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDuplicateEmail(false);

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
      await register(email.trim(), password, invite ?? undefined);
      // O registo não faz login: entra-se a seguir com os mesmos dados.
      await signIn(email, password);
      navigate("/conta", {
        replace: true,
        state: {
          notice: "Conta criada. Enviámos-te um email com um link para confirmares o endereço.",
        },
      });
    } catch (err) {
      if (err instanceof ApiError && err.type === "duplicate-email") {
        setDuplicateEmail(true);
      } else {
        setError(
          describeError(err, {
            "weak-password": WEAK_PASSWORD,
            "invalid-invite": INVALID_INVITE,
            "invite-required": INVALID_INVITE,
          }),
        );
      }
      setSubmitting(false);
    }
  }

  if (!invite) {
    return (
      <AuthSheet title="Criar conta">
        <p>
          O DomiOS está aberto só a quem tem convite. Pede acesso e, quando for aprovado, recebes um email com o link
          para criares a conta.
        </p>
        <p>
          <a className="button-primary" href={REQUEST_ACCESS_URL}>
            Pedir acesso
          </a>
        </p>
        <p className="form-links">
          Já tens conta? <Link to="/entrar">Entrar</Link>
        </p>
      </AuthSheet>
    );
  }

  return (
    <AuthSheet title="Criar conta">
      <p className="muted">Acesso aprovado. Usa o email para onde enviámos o convite.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <small className="muted">
            Entre {PASSWORD_MIN_LENGTH} e {PASSWORD_MAX_LENGTH} caracteres.
          </small>
        </label>
        <label className="form-field">
          <span>Repetir password</span>
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
        {duplicateEmail && (
          <p className="form-error" role="alert">
            Já existe uma conta com este email. <Link to="/entrar">Entrar</Link> ou{" "}
            <Link to="/esqueci-password">recuperar a password</Link>.
          </p>
        )}
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? "A criar conta…" : "Criar conta"}
        </button>
      </form>

      <p className="form-links">
        Já tens conta? <Link to="/entrar">Entrar</Link>
      </p>
    </AuthSheet>
  );
}
