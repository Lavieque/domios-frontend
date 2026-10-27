import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createHousehold } from "../api/households";
import { describeError } from "../auth/errors";
import { useSession } from "../auth/useSession";
import { storeHouseholdId } from "../household/currentHousehold";

// Todas as casas reais são em Portugal; a Api guarda o fuso para datas e
// refeições, a moeda para os preços.
const TIME_ZONE = "Europe/Lisbon";
const CURRENCY = "EUR";

export function CreateHouseholdPage() {
  const session = useSession()!;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
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
      navigate("/casa", { replace: true });
    } catch (err) {
      setError(describeError(err, { "invalid-argument": "Preenche o nome da casa e o teu nome." }));
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <h1>Criar casa</h1>
      <p className="muted">
        A casa junta a despensa, as listas de compras e o plano de refeições. Ficas como administrador e podes
        acrescentar o resto da família depois.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Nome da casa</span>
          <input type="text" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="form-field">
          <span>O teu nome</span>
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
          {submitting ? "A criar…" : "Criar casa"}
        </button>
      </form>

      <p className="form-links">
        <Link to="/casa">Voltar</Link>
      </p>
    </div>
  );
}
