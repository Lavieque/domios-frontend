import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  addMember,
  getHousehold,
  linkMemberToUser,
  MemberRole,
  memberRoleLabels,
  removeMember,
  updateHousehold,
  updateMember,
  type HouseholdDto,
  type MemberDto,
} from "../api/households";
import { describeError } from "../auth/errors";
import { useHouseholds } from "../household/useHouseholds";

const ROLES = [MemberRole.Admin, MemberRole.Adult, MemberRole.Child, MemberRole.Guest];

/** Erros da Api que estes formulários esperam (ProblemDetailsExceptionHandler). */
const MEMBER_ERRORS = {
  "invalid-argument": "Falta o nome do membro.",
  "invariant-violation": "A casa precisa de ficar com pelo menos um administrador.",
  "forbidden-household-role": "Só um administrador da casa pode fazer isto.",
};

export function HouseholdPage() {
  const { loading, error, households, current, select, reload } = useHouseholds();
  const [household, setHousehold] = useState<HouseholdDto | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const currentId = current?.householdId ?? null;
  useEffect(() => {
    if (!currentId) return;
    let cancelled = false;
    setHousehold(null);
    setDetailError(null);
    setAdding(false);
    getHousehold(currentId)
      .then((result) => !cancelled && setHousehold(result))
      .catch((err: unknown) => !cancelled && setDetailError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  if (loading) {
    return <p className="muted loading">A carregar…</p>;
  }
  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (households.length === 0) {
    return <Navigate to="/casa/nova" replace />;
  }

  const isAdmin = current?.role === MemberRole.Admin;
  const members = household ? sortMembers(household.members, current?.memberId) : [];
  const linkedCount = members.filter((m) => m.userId).length;

  return (
    <div className="page settings-page">
      {household && isAdmin ? (
        <HouseholdName household={household} onSaved={setHousehold} />
      ) : (
        <h1>{current?.name}</h1>
      )}
      {current && (
        <p className="page-sub">
          És {memberRoleLabels[current.role].toLowerCase()} desta casa.
          {household && (
            <>
              {" "}
              {members.length} {members.length === 1 ? "membro" : "membros"}, {linkedCount} com conta.
            </>
          )}
        </p>
      )}

      {households.length > 1 && (
        <div className="chip-row household-switch" role="group" aria-label="As tuas casas">
          {households.map((h) => (
            <button
              key={h.householdId}
              type="button"
              className="chip"
              aria-pressed={h.householdId === currentId}
              onClick={() => select(h.householdId)}
            >
              {h.name}
            </button>
          ))}
        </div>
      )}

      {detailError && (
        <p className="form-error" role="alert">
          {detailError}
        </p>
      )}
      {!household && !detailError && <p className="muted loading">A carregar membros…</p>}

      {household && (
        <>
          <div className="section-head">
            <h2>Membros</h2>
            {isAdmin && !adding && (
              <button type="button" className="row-action" onClick={() => setAdding(true)}>
                Acrescentar membro
              </button>
            )}
          </div>
          <ul className="member-list">
            {members.map((member) => (
              <MemberRow
                key={member.memberId}
                householdId={household.householdId}
                member={member}
                isMe={member.memberId === current?.memberId}
                isAdmin={isAdmin}
                onSaved={setHousehold}
                onRemoved={(left) => {
                  if (left) {
                    reload();
                  } else {
                    setHousehold({
                      ...household,
                      members: household.members.filter((m) => m.memberId !== member.memberId),
                    });
                  }
                }}
              />
            ))}
            {adding && (
              <li className="member-row member-row-form">
                <AddMemberForm
                  householdId={household.householdId}
                  onSaved={(next) => {
                    setHousehold(next);
                    setAdding(false);
                  }}
                  onCancel={() => setAdding(false)}
                />
              </li>
            )}
          </ul>
          {!isAdmin && (
            <p className="settings-note muted">Só um administrador acrescenta membros, muda papéis ou liga contas.</p>
          )}

          <h2>Casa</h2>
          <dl className="settings-list">
            <div className="settings-row">
              <dt>Fuso horário</dt>
              <dd>{household.timeZone}</dd>
            </div>
            <div className="settings-row">
              <dt>Moeda</dt>
              <dd>{household.currency}</dd>
            </div>
            <div className="settings-row">
              <dt>Histórico</dt>
              <dd>
                <span className="muted">O que mudou na despensa, nas listas e no plano.</span>
                <Link to="/casa/historico" className="settings-action">
                  Ver histórico
                </Link>
              </dd>
            </div>
            <div className="settings-row">
              <dt>Outra casa</dt>
              <dd>
                <span className="muted">Cada casa tem a sua despensa, listas e plano.</span>
                <Link to="/casa/nova" className="settings-action">
                  Criar casa
                </Link>
              </dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}

/** Tu primeiro, depois administradores, adultos, crianças e convidados, por nome. */
function sortMembers(members: MemberDto[], myMemberId: string | undefined): MemberDto[] {
  return [...members].sort(
    (a, b) =>
      Number(b.memberId === myMemberId) - Number(a.memberId === myMemberId) ||
      a.role - b.role ||
      a.name.localeCompare(b.name, "pt-PT"),
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Idade em anos a partir de `yyyy-mm-dd`, pela data local. */
function ageFrom(dateOfBirth: string): number | null {
  const [y, m, d] = dateOfBirth.split("-").map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age >= 0 ? age : null;
}

function parseRestrictions(text: string): string[] {
  return text
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

function HouseholdName({ household, onSaved }: { household: HouseholdDto; onSaved: (h: HouseholdDto) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(household.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onSaved(await updateHousehold(household.householdId, { name: name.trim() }));
      setEditing(false);
    } catch (err) {
      setError(describeError(err, { "invalid-argument": "A casa precisa de um nome." }));
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div className="title-row">
        <h1>{household.name}</h1>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setName(household.name);
            setEditing(true);
          }}
        >
          Mudar nome
        </button>
      </div>
    );
  }

  return (
    <form className="title-form" onSubmit={handleSubmit}>
      <h1 className="visually-hidden">{household.name}</h1>
      <label className="form-field">
        <span>Nome da casa</span>
        <input type="text" required maxLength={200} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="button-row">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "A guardar…" : "Guardar"}
        </button>
        <button type="button" className="button-secondary" onClick={() => setEditing(false)} disabled={busy}>
          Cancelar
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

type RowMode = "view" | "edit" | "link" | "remove";

interface MemberRowProps {
  householdId: string;
  member: MemberDto;
  isMe: boolean;
  isAdmin: boolean;
  onSaved: (household: HouseholdDto) => void;
  /** `left` quando o próprio saiu da casa. */
  onRemoved: (left: boolean) => void;
}

function MemberRow({ householdId, member, isMe, isAdmin, onSaved, onRemoved }: MemberRowProps) {
  const [mode, setMode] = useState<RowMode>("view");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const age = member.dateOfBirth ? ageFrom(member.dateOfBirth) : null;
  const canEdit = isAdmin || isMe;
  const canRemove = isAdmin || isMe;

  function open(next: RowMode) {
    setError(null);
    setMode(next);
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      await removeMember(householdId, member.memberId);
      onRemoved(isMe);
    } catch (err) {
      setError(describeError(err, MEMBER_ERRORS));
      setBusy(false);
    }
  }

  return (
    <li className={mode === "view" ? "member-row" : "member-row is-open"}>
      <span className={isMe ? "member-avatar is-me" : "member-avatar"} aria-hidden="true">
        {initials(member.name)}
      </span>
      <div className="member-main">
        <span className="member-name">
          {member.name}
          {isMe && <span className="muted"> (tu)</span>}
        </span>
        <span className="member-meta">
          <span className={member.role === MemberRole.Admin ? "pill pill-accent2" : "pill pill-muted"}>
            {memberRoleLabels[member.role]}
          </span>
          {age !== null && <span className="muted">{age === 1 ? "1 ano" : `${age} anos`}</span>}
          {member.userId ? (
            <span className="member-account">
              <span className="member-dot is-linked" aria-hidden="true" />
              Com conta
            </span>
          ) : (
            <span className="member-account muted">
              <span className="member-dot" aria-hidden="true" />
              Sem conta
            </span>
          )}
        </span>
        {member.dietaryRestrictions.length > 0 && (
          <span className="member-restrictions" aria-label="Restrições alimentares">
            {member.dietaryRestrictions.map((r) => (
              <span key={r} className="tag member-restriction">
                {r}
              </span>
            ))}
          </span>
        )}
      </div>

      {mode === "view" && (canEdit || canRemove) && (
        <div className="member-actions">
          {canEdit && (
            <button type="button" className="row-action" onClick={() => open("edit")}>
              Editar
            </button>
          )}
          {isAdmin && !member.userId && (
            <button type="button" className="row-action" onClick={() => open("link")}>
              Ligar conta
            </button>
          )}
          {canRemove && (
            <button type="button" className="button-danger" onClick={() => open("remove")}>
              {isMe ? "Sair da casa" : "Remover"}
            </button>
          )}
        </div>
      )}

      {mode === "edit" && (
        <EditMemberForm
          householdId={householdId}
          member={member}
          canChangeRole={isAdmin}
          onSaved={(next) => {
            onSaved(next);
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      )}

      {mode === "link" && (
        <LinkAccountForm
          householdId={householdId}
          member={member}
          onLinked={async () => {
            onSaved(await getHousehold(householdId));
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      )}

      {mode === "remove" && (
        <div className="member-panel member-confirm" role="group" aria-label={isMe ? "Sair da casa" : "Remover membro"}>
          <p>
            {isMe
              ? "Deixas de ver a despensa, as listas e o plano desta casa. Para voltares, um administrador tem de te acrescentar outra vez."
              : `${member.name} deixa de fazer parte desta casa.`}
          </p>
          <div className="button-row">
            <button type="button" className="button-danger is-confirm" onClick={handleRemove} disabled={busy}>
              {busy ? "A remover…" : isMe ? "Sair da casa" : `Remover ${member.name}`}
            </button>
            <button type="button" className="button-secondary" onClick={() => setMode("view")} disabled={busy}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="form-error member-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

interface EditMemberFormProps {
  householdId: string;
  member: MemberDto;
  canChangeRole: boolean;
  onSaved: (household: HouseholdDto) => void;
  onCancel: () => void;
}

function EditMemberForm({ householdId, member, canChangeRole, onSaved, onCancel }: EditMemberFormProps) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<MemberRole>(member.role);
  const [restrictions, setRestrictions] = useState(member.dietaryRestrictions.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onSaved(
        await updateMember(householdId, member.memberId, {
          name: name.trim(),
          // O papel só vai quando muda: mandá-lo, mesmo igual, é só para o Admin.
          ...(canChangeRole && role !== member.role ? { role } : {}),
          dietaryRestrictions: parseRestrictions(restrictions),
        }),
      );
    } catch (err) {
      setError(describeError(err, MEMBER_ERRORS));
      setBusy(false);
    }
  }

  return (
    <form className="member-panel member-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Nome</span>
        <input type="text" required maxLength={200} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {canChangeRole && (
        <label className="form-field">
          <span>Papel</span>
          <select value={role} onChange={(e) => setRole(Number(e.target.value) as MemberRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {memberRoleLabels[r]}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="form-field member-form-wide">
        <span>Restrições alimentares</span>
        <input
          type="text"
          placeholder="Ex.: sem glúten, vegetariano"
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
        />
        <small>Separa por vírgulas.</small>
      </label>
      {error && (
        <p className="form-error member-form-wide" role="alert">
          {error}
        </p>
      )}
      <div className="button-row member-form-wide">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "A guardar…" : "Guardar"}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface LinkAccountFormProps {
  householdId: string;
  member: MemberDto;
  onLinked: () => Promise<void>;
  onCancel: () => void;
}

function LinkAccountForm({ householdId, member, onLinked, onCancel }: LinkAccountFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await linkMemberToUser(householdId, member.memberId, email.trim());
      await onLinked();
    } catch (err) {
      setError(
        describeError(err, {
          "not-found": "Não há nenhuma conta DomiOS com esse email. A pessoa tem de se registar primeiro.",
          "member-already-linked": "Essa conta já está ligada a outro membro desta casa.",
          "forbidden-household-role": MEMBER_ERRORS["forbidden-household-role"],
        }),
      );
      setBusy(false);
    }
  }

  return (
    <form className="member-panel member-form" onSubmit={handleSubmit}>
      <label className="form-field member-form-wide">
        <span>Email da conta de {member.name}</span>
        <input type="email" required autoFocus autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        <small>A pessoa passa a ver e a mudar tudo nesta casa: despensa, listas e plano.</small>
      </label>
      {error && (
        <p className="form-error member-form-wide" role="alert">
          {error}
        </p>
      )}
      <div className="button-row member-form-wide">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "A ligar…" : "Ligar conta"}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface AddMemberFormProps {
  householdId: string;
  onSaved: (household: HouseholdDto) => void;
  onCancel: () => void;
}

function AddMemberForm({ householdId, onSaved, onCancel }: AddMemberFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<MemberRole>(MemberRole.Adult);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onSaved(
        await addMember(householdId, {
          name: name.trim(),
          role,
          dateOfBirth: dateOfBirth || null,
          dietaryRestrictions: parseRestrictions(restrictions),
        }),
      );
    } catch (err) {
      setError(describeError(err, MEMBER_ERRORS));
      setBusy(false);
    }
  }

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <h3 className="member-form-wide">Membro novo</h3>
      <label className="form-field">
        <span>Nome</span>
        <input type="text" required maxLength={200} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="form-field">
        <span>Papel</span>
        <select value={role} onChange={(e) => setRole(Number(e.target.value) as MemberRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {memberRoleLabels[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Data de nascimento</span>
        <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        <small>Opcional.</small>
      </label>
      <label className="form-field">
        <span>Restrições alimentares</span>
        <input
          type="text"
          placeholder="Ex.: sem glúten, vegetariano"
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
        />
        <small>Separa por vírgulas.</small>
      </label>
      <p className="muted member-form-wide">
        Um membro sem conta faz parte da casa mas não entra no DomiOS. Para entrar, liga-o depois à conta dele.
      </p>
      {error && (
        <p className="form-error member-form-wide" role="alert">
          {error}
        </p>
      )}
      <div className="button-row member-form-wide">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "A acrescentar…" : "Acrescentar"}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
