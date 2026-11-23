import { Busy } from "../components/Busy";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../api/auth";
import { ApiError } from "../api/http";
import {
  acceptMemberInvite,
  forgetInviteToken,
  lookupMemberInvite,
  registerWithMemberInvite,
  rememberedInviteToken,
  rememberInviteToken,
  type MemberInviteDetailsDto,
} from "../api/memberInvites";
import { signIn } from "../auth/actions";
import { describeError } from "../auth/errors";
import { tokenFromHash } from "../auth/links";
import { useSession } from "../auth/useSession";
import { AuthSheet } from "../components/AuthSheet";
import { householdsChanged, storeHouseholdId } from "../household/currentHousehold";
import { getLanguage, useT } from "../i18n";
import { useLoad } from "../useLoad";

/**
 * Página do link do convite de membro (`/convite#token=...`, DomiOS_API_Fase3.md, adenda 2026-11-23).
 * Sem sessão: criar a conta com o email do convite, ou entrar e voltar aqui. Com sessão: aceitar.
 * O token fica na sessão do separador para a ida a /entrar não o perder.
 */
export function InvitePage() {
  const t = useT();
  const location = useLocation();
  const hashToken = tokenFromHash(location.hash);
  if (hashToken) rememberInviteToken(hashToken);
  const token = hashToken ?? rememberedInviteToken();
  const invite = useLoad(token ? [token] : null, () => lookupMemberInvite(token!));

  if (!token || invite.failure) {
    return (
      <AuthSheet title={t.memberInvite.title}>
        <p className="form-error" role="alert">
          {t.memberInvite.invalid}
        </p>
      </AuthSheet>
    );
  }
  if (!invite.data) {
    return (
      <AuthSheet title={t.memberInvite.title}>
        <p className="muted loading">{t.memberInvite.loading}</p>
      </AuthSheet>
    );
  }
  return <InviteDetails token={token} invite={invite.data} />;
}

function InviteDetails({ token, invite }: { token: string; invite: MemberInviteDetailsDto }) {
  const t = useT();
  const session = useSession();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

  function enterHousehold(userId: string) {
    forgetInviteToken();
    storeHouseholdId(userId, invite.householdId);
    householdsChanged(userId);
    setJoined(true);
    navigate("/casa", { replace: true, state: { notice: t.memberInvite.joined(invite.householdName) } });
  }

  if (joined) return <Navigate to="/casa" replace />;

  return (
    <AuthSheet title={t.memberInvite.title}>
      <p>{t.memberInvite.intro(invite.householdName, invite.memberName)}</p>
      <p className="muted">{t.memberInvite.forEmail(invite.email)}</p>
      {session ? (
        <AcceptInvite token={token} email={invite.email} onAccepted={() => enterHousehold(session.userId)} />
      ) : (
        <>
          <RegisterWithInvite token={token} email={invite.email} onRegistered={enterHousehold} />
          <p className="form-links">
            {t.memberInvite.haveAccount} <Link to="/entrar?next=/convite">{t.memberInvite.signInToAccept}</Link>
          </p>
        </>
      )}
    </AuthSheet>
  );
}

function AcceptInvite({ token, email, onAccepted }: { token: string; email: string; onAccepted: () => void }) {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setError(null);
    setBusy(true);
    try {
      await acceptMemberInvite(token);
      onAccepted();
    } catch (err) {
      setError(
        describeError(err, {
          "invite-email-mismatch": t.memberInvite.wrongAccount(email),
          "invalid-invite": t.memberInvite.invalid,
          "member-already-linked": t.householdPage.errors.alreadyLinked,
        }),
      );
      setBusy(false);
    }
  }

  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="button-primary" disabled={busy} onClick={accept}>
        {busy ? <Busy>{t.memberInvite.accepting}</Busy> : t.memberInvite.accept}
      </button>
    </>
  );
}

function RegisterWithInvite({ token, email, onRegistered }: { token: string; email: string; onRegistered: (userId: string) => void }) {
  const t = useT();
  const weakPassword = t.auth.weakPassword(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDuplicateEmail(false);
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setError(weakPassword);
      return;
    }
    if (password !== confirmation) {
      setError(t.auth.passwordsDiffer);
      return;
    }

    setBusy(true);
    try {
      const { userId } = await registerWithMemberInvite(email, password, token, getLanguage());
      // O registo não faz login: entra-se a seguir com os mesmos dados.
      await signIn(email, password);
      onRegistered(userId);
    } catch (err) {
      if (err instanceof ApiError && err.type === "duplicate-email") {
        setDuplicateEmail(true);
      } else {
        setError(describeError(err, { "weak-password": weakPassword, "invalid-invite": t.memberInvite.invalid }));
      }
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p>{t.memberInvite.createAccount}</p>
      <label className="form-field">
        <span>{t.common.email}</span>
        <input type="email" autoComplete="email" value={email} readOnly />
      </label>
      <label className="form-field">
        <span>{t.common.password}</span>
        <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <small className="muted">{t.auth.passwordLength(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)}</small>
      </label>
      <label className="form-field">
        <span>{t.auth.repeatPassword}</span>
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
          {t.auth.duplicateEmail} <Link to="/entrar?next=/convite">{t.memberInvite.signInToAccept}</Link>.
        </p>
      )}
      <button type="submit" className="button-primary" disabled={busy}>
        {busy ? <Busy>{t.auth.creatingAccount}</Busy> : t.auth.createAccount}
      </button>
    </form>
  );
}
