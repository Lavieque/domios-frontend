import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { admin, MEMBER_ROLE, type HouseholdDetail, type HouseholdMember } from "../api";
import { ConfirmAction, State } from "../components";
import { dateOnly, describe, useLoad } from "../hooks";

const ROLE_LABEL: Record<number, string> = { 0: "Administrador", 1: "Adulto", 2: "Criança", 3: "Convidado" };

export function HouseholdDetailPage() {
  const { id = "" } = useParams();
  const load = useLoad(() => admin.household(id), [id]);
  const house = load.data;

  return (
    <>
      <p className="crumbs">
        <Link to="/casas">Todas as casas</Link>
      </p>
      <State loading={load.loading} error={load.error} empty={!house} emptyText="Casa não encontrada." />
      {house && (
        <>
          <Header house={house} onChanged={load.reload} />
          <h2>Membros</h2>
          <ul className="rows">
            {house.members.map((m) => (
              <MemberRow key={m.memberId} houseId={house.householdId} member={m} onChanged={load.reload} />
            ))}
          </ul>
          <p className="note-muted">
            Não há apagar casa neste ecrã: os dados de uma casa estendem-se por todos os módulos e não se desfazem. Uma casa nunca fica sem
            administrador.
          </p>
        </>
      )}
    </>
  );
}

function Header({ house, onChanged }: { house: HouseholdDetail; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(house.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await admin.renameHousehold(house.householdId, name.trim());
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="page-head">
      <div>
        {editing ? (
          <form className="rename" onSubmit={save}>
            <input type="text" aria-label="Nome da casa" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit" className="button-primary" disabled={busy || !name.trim()}>
              {busy ? "A guardar…" : "Guardar"}
            </button>
            <button type="button" className="button-secondary" disabled={busy} onClick={() => { setEditing(false); setName(house.name); setError(null); }}>
              Cancelar
            </button>
          </form>
        ) : (
          <h1>
            {house.name}{" "}
            <button type="button" className="link-button" onClick={() => setEditing(true)}>
              Mudar nome
            </button>
          </h1>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="page-sub">
          Criada a {dateOnly.format(new Date(house.createdAt))} · {house.timeZone} · {house.currency} · {house.locale}
        </p>
      </div>
    </header>
  );
}

function MemberRow({ houseId, member: m, onChanged }: { houseId: string; member: HouseholdMember; onChanged: () => void }) {
  const act = (fn: () => Promise<unknown>) => async () => {
    await fn();
    onChanged();
  };
  const isAdmin = m.role === MEMBER_ROLE.Admin;
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{m.name}</strong>
          {m.userEmail && <span className="muted">{m.userEmail}</span>}
        </div>
        {m.dietaryRestrictions.length > 0 && <p className="row-meta">Restrições: {m.dietaryRestrictions.join(", ")}</p>}
      </div>
      <div className="row-state">
        <span className={`pill ${isAdmin ? "pill-navy" : "pill-muted"}`}>{ROLE_LABEL[m.role] ?? m.role}</span>
        <span className={`pill ${m.userId ? "pill-good" : "pill-muted"}`}>{m.userId ? "Com conta" : "Sem conta"}</span>
      </div>
      <div className="row-actions">
        {isAdmin ? (
          <ConfirmAction
            label="Passar a adulto"
            confirmLabel="Passar a adulto"
            onConfirm={act(() => admin.setMemberRole(houseId, m.memberId, MEMBER_ROLE.Adult))}
          />
        ) : (
          <ConfirmAction
            label="Tornar administrador"
            confirmLabel="Tornar administrador"
            onConfirm={act(() => admin.setMemberRole(houseId, m.memberId, MEMBER_ROLE.Admin))}
          />
        )}
        <ConfirmAction label="Remover" confirmLabel="Remover da casa" tone="danger" onConfirm={act(() => admin.removeMember(houseId, m.memberId))} />
      </div>
    </li>
  );
}
