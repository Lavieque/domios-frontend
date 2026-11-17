import { Busy } from "../components/Busy";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createHousehold } from "../api/households";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import { householdsChanged, storeHouseholdId } from "../household/currentHousehold";
import { tr } from "../i18n";

// Todas as casas reais são em Portugal; a Api guarda o fuso para datas e
// refeições, a moeda para os preços.
const TIME_ZONE = "Europe/Lisbon";
const CURRENCY = "EUR";

export function CreateHouseholdPage() {
  const session = useSession()!;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const location = useLocation();
  // O nome pode vir no estado da navegação, mesmo depois de a página abrir (o tour da demo dá-o
  // assim): enquanto não se escreve nada, o campo mostra-o.
  const given = (location.state as { memberName?: unknown } | null)?.memberName;
  const [typed, setMemberName] = useState<string | null>(null);
  const memberName = typed ?? (typeof given === "string" ? given : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const household = await createHousehold({
        name: name.trim(),
        timeZone: TIME_ZONE,
        currency: CURRENCY,
        adminMemberName: memberName.trim(),
      });
      storeHouseholdId(session.userId, household.householdId);
      // A lista guardada ainda não tem esta casa: esquece-a e avisa a barra e o menu,
      // senão a página da casa arrancava com a cópia velha (vazia) e mandava criar outra.
      householdsChanged(session.userId);
      navigate("/casa", { replace: true });
    } catch (err) {
      setError(
        describeError(err, {
          "invalid-argument": tr().createHousehold.invalid,
        }),
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="page settings-page">
      <nav className="crumb" aria-label={tr().common.breadcrumb}>
        <Link to="/casa" className="back-link">
          {tr().shell.links.household.label}
        </Link>
      </nav>
      <header className="page-head">
        <h1>{tr().createHousehold.title}</h1>
      </header>
      <p className="page-lede">{tr().createHousehold.lede}</p>

      <form className="auth-form create-household-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>{tr().createHousehold.name}</span>
          <input type="text" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="form-field">
          <span>{tr().createHousehold.yourName}</span>
          <input
            type="text"
            autoComplete="given-name"
            required
            maxLength={200}
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? <Busy>{tr().common.creating}</Busy> : tr().createHousehold.title}
        </button>
      </form>
    </div>
  );
}
