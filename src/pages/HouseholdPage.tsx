import { Busy } from "../components/Busy";
import { PageSkeleton } from "../components/PageSkeleton";
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
import { AvoidedIngredientsPanel, NutritionGoalsPanel } from "../components/MemberPreferencesPanels";
import { useHouseholds } from "../household/useHouseholds";
import { localeOf, numberFormat } from "../i18n/format";
import { localized, tr } from "../i18n";

const ROLES = [MemberRole.Admin, MemberRole.Adult, MemberRole.Child, MemberRole.Guest];

/** Erros da Api que estes formulários esperam (ProblemDetailsExceptionHandler). */
const MEMBER_ERRORS = localized((t) => ({
  "invalid-argument": t.householdPage.errors.noName,
  "invariant-violation": t.householdPage.errors.lastAdmin,
  "forbidden-household-role": t.householdPage.errors.adminOnly,
}));

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
    return <PageSkeleton />;
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
      <header className="page-head">
        <div>
          {household && isAdmin ? (
            <HouseholdName household={household} onSaved={setHousehold} />
          ) : (
            <h1>{current?.name}</h1>
          )}
          {current && (
            <p className="page-head-sub">
              {tr().householdPage.youAre(memberRoleLabels[current.role])}
              {household && (
                <>
                  {" "}
                  {tr().householdPage.memberCount(members.length, linkedCount)}
                </>
              )}
            </p>
          )}
        </div>
      </header>

      {households.length > 1 && (
        <div className="chip-row household-switch" role="group" aria-label={tr().householdPage.yourHouseholds}>
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
      {!household && !detailError && <p className="muted loading">{tr().householdPage.loadingMembers}</p>}

      {household && (
        <>
          <section className="panel" aria-labelledby="household-members">
            <div className="side-head">
              <h2 id="household-members">{tr().householdPage.members}</h2>
              {isAdmin && !adding && (
                <button type="button" className="link-button" onClick={() => setAdding(true)}>
                  {tr().householdPage.addMember}
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
              <p className="settings-note muted">{tr().householdPage.adminNote}</p>
            )}
          </section>

          <section className="panel" aria-labelledby="household-settings">
            <h2 id="household-settings">{tr().householdPage.household}</h2>
            <dl className="settings-list">
              <div className="settings-row">
                <dt>{tr().householdPage.timeZone}</dt>
                <dd>{household.timeZone}</dd>
              </div>
              <div className="settings-row">
                <dt>{tr().householdPage.currency}</dt>
                <dd>{household.currency}</dd>
              </div>
              <TravelSettings household={household} isAdmin={isAdmin} onSaved={setHousehold} />
              <div className="settings-row">
                <dt>{tr().householdPage.history}</dt>
                <dd>
                  <span className="muted">{tr().householdPage.historyHint}</span>
                  <Link to="/casa/historico" className="settings-action">
                    {tr().householdPage.seeHistory}
                  </Link>
                </dd>
              </div>
              <div className="settings-row">
                <dt>{tr().householdPage.otherHousehold}</dt>
                <dd>
                  <span className="muted">{tr().householdPage.otherHint}</span>
                  <Link to="/casa/nova" className="settings-action">
                    {tr().householdPage.createHousehold}
                  </Link>
                </dd>
              </div>
            </dl>
          </section>
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
      a.name.localeCompare(b.name, localeOf()),
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
      setError(
        describeError(err, {
          "invalid-argument": tr().householdPage.errors.householdName,
        }),
      );
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
          {tr().householdPage.rename}
        </button>
      </div>
    );
  }

  return (
    <form className="title-form" onSubmit={handleSubmit}>
      <h1 className="visually-hidden">{household.name}</h1>
      <label className="form-field">
        <span>{tr().householdPage.householdName}</span>
        <input type="text" required maxLength={200} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="button-row">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? <Busy>{tr().common.saving}</Busy> : tr().common.save}
        </button>
        <button type="button" className="button-secondary" onClick={() => setEditing(false)} disabled={busy}>
          {tr().common.cancel}
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

type RowMode = "view" | "edit" | "link" | "remove" | "avoid" | "goals";

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
      {/* A idade numa coluna fixa, como o número de um dia; sem data de nascimento, as iniciais. */}
      <span className="member-lead" aria-hidden="true">
        {age !== null ? (
          <>
            <span className="member-lead-number">{age}</span>
            <span className="recipe-row-lead-label">{tr().householdPage.years(age)}</span>
          </>
        ) : (
          <span className="member-lead-number is-initials">{initials(member.name)}</span>
        )}
      </span>
      <div className="member-main">
        <span className="member-name">
          {member.name}
          {isMe && <span className="muted">{tr().householdPage.you}</span>}
        </span>
        <span className="member-meta">
          <span className={member.role === MemberRole.Admin ? "member-role is-admin" : "member-role"}>
            {memberRoleLabels[member.role]}
          </span>
          {age !== null && <span className="visually-hidden">, {tr().householdPage.age(age)}</span>}
          <span>{member.userId ? tr().householdPage.withAccount : tr().householdPage.withoutAccount}</span>
          {member.defaultPortion !== undefined && member.defaultPortion !== 1 && (
            <span>{tr().householdPage.portion(member.defaultPortion.toLocaleString(localeOf()))}</span>
          )}
        </span>
        {member.dietaryRestrictions.length > 0 && (
          <span className="member-restrictions" aria-label={tr().householdPage.restrictions}>
            {member.dietaryRestrictions.map((r) => (
              <span key={r} className="tag member-restriction">
                {r}
              </span>
            ))}
          </span>
        )}
      </div>

      {mode === "view" && (
        <div className="member-actions">
          <button type="button" className="link-button" onClick={() => open("avoid")}>
            {tr().householdPage.avoid}
          </button>
          <button type="button" className="link-button" onClick={() => open("goals")}>
            {tr().householdPage.goals}
          </button>
          {canEdit && (
            <button type="button" className="link-button" onClick={() => open("edit")}>
              {tr().householdPage.edit}
            </button>
          )}
          {isAdmin && !member.userId && (
            <button type="button" className="link-button" onClick={() => open("link")}>
              {tr().householdPage.linkAccount}
            </button>
          )}
          {canRemove && (
            <button type="button" className="button-danger" onClick={() => open("remove")}>
              {isMe ? tr().householdPage.leave : tr().householdPage.remove}
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

      {mode === "avoid" && (
        <AvoidedIngredientsPanel
          householdId={householdId}
          member={member}
          canEdit={canEdit}
          onClose={() => setMode("view")}
        />
      )}

      {mode === "goals" && (
        <NutritionGoalsPanel
          householdId={householdId}
          member={member}
          canEdit={canEdit}
          onClose={() => setMode("view")}
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
        <div className="member-panel member-confirm" role="group" aria-label={isMe ? tr().householdPage.leave : tr().householdPage.removeMember}>
          <p>
            {isMe
              ? tr().householdPage.leaveWarning
              : tr().householdPage.removeWarning(member.name)}
          </p>
          <div className="button-row">
            <button type="button" className="button-danger is-confirm" onClick={handleRemove} disabled={busy}>
              {busy ? <Busy>{tr().householdPage.removing}</Busy> : isMe ? tr().householdPage.leave : tr().householdPage.removeName(member.name)}
            </button>
            <button type="button" className="button-secondary" onClick={() => setMode("view")} disabled={busy}>
              {tr().common.cancel}
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
  const [portion, setPortion] = useState(String(member.defaultPortion ?? 1).replace(".", ","));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const portionValue = Number(portion.replace(",", "."));
    if (!(portionValue >= 0.25 && portionValue <= 3)) {
      setError(tr().householdPage.errors.portion);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onSaved(
        await updateMember(householdId, member.memberId, {
          name: name.trim(),
          // O papel só vai quando muda: mandá-lo, mesmo igual, é só para o Admin.
          ...(canChangeRole && role !== member.role ? { role } : {}),
          dietaryRestrictions: parseRestrictions(restrictions),
          defaultPortion: Math.round(portionValue * 100) / 100,
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
        <span>{tr().householdPage.name}</span>
        <input type="text" required maxLength={200} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {canChangeRole && (
        <label className="form-field">
          <span>{tr().householdPage.role}</span>
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
        <span>{tr().householdPage.restrictions}</span>
        <input
          type="text"
          placeholder={tr().householdPage.restrictionsPlaceholder}
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
        />
        <small>{tr().householdPage.commaSeparated}</small>
      </label>
      <label className="form-field">
        <span>{tr().householdPage.usualPortion}</span>
        <input type="text" inputMode="decimal" value={portion} onChange={(e) => setPortion(e.target.value)} />
        <small>{tr().householdPage.portionHint}</small>
      </label>
      {error && (
        <p className="form-error member-form-wide" role="alert">
          {error}
        </p>
      )}
      <div className="button-row member-form-wide">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? <Busy>{tr().common.saving}</Busy> : tr().common.save}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
          {tr().common.cancel}
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
          "not-found": tr().householdPage.errors.noAccount,
          "member-already-linked": tr().householdPage.errors.alreadyLinked,
          "forbidden-household-role": MEMBER_ERRORS["forbidden-household-role"],
        }),
      );
      setBusy(false);
    }
  }

  return (
    <form className="member-panel member-form" onSubmit={handleSubmit}>
      <label className="form-field member-form-wide">
        <span>{tr().householdPage.accountEmail(member.name)}</span>
        <input
          type="email"
          required
          autoFocus
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <small>{tr().householdPage.linkHint}</small>
      </label>
      {error && (
        <p className="form-error member-form-wide" role="alert">
          {error}
        </p>
      )}
      <div className="button-row member-form-wide">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? <Busy>{tr().householdPage.linking}</Busy> : tr().householdPage.linkAccount}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
          {tr().common.cancel}
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
      <h3 className="member-form-wide">{tr().householdPage.newMember}</h3>
      <label className="form-field">
        <span>{tr().householdPage.name}</span>
        <input type="text" required maxLength={200} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="form-field">
        <span>{tr().householdPage.role}</span>
        <select value={role} onChange={(e) => setRole(Number(e.target.value) as MemberRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {memberRoleLabels[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>{tr().householdPage.birthDate}</span>
        <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        <small>{tr().householdPage.optional}</small>
      </label>
      <label className="form-field">
        <span>{tr().householdPage.restrictions}</span>
        <input
          type="text"
          placeholder={tr().householdPage.restrictionsPlaceholder}
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
        />
        <small>{tr().householdPage.commaSeparated}</small>
      </label>
      <p className="muted member-form-wide">
        {tr().householdPage.noAccountNote}
      </p>
      {error && (
        <p className="form-error member-form-wide" role="alert">
          {error}
        </p>
      )}
      <div className="button-row member-form-wide">
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? tr().householdPage.adding : tr().householdPage.add}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={busy}>
          {tr().common.cancel}
        </button>
      </div>
    </form>
  );
}

const kmFormat = numberFormat({ maximumFractionDigits: 1 });
const perKmFormat = numberFormat({ style: "currency", currency: "EUR", maximumFractionDigits: 3 });

/** Custo por km e distância máxima das lojas (adenda 2026-11-09 de DomiOS_API_Fase5.md, E.2). Só Admin muda. */
function TravelSettings({ household, isAdmin, onSaved }: { household: HouseholdDto; isAdmin: boolean; onSaved: (h: HouseholdDto) => void }) {
  const [editing, setEditing] = useState(false);
  const [cost, setCost] = useState("");
  const [distance, setDistance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const costPerKm = household.travelCostPerKm;
  const maxKm = household.maxStoreDistanceKm;
  if (costPerKm === undefined || maxKm === undefined) return null;

  function start() {
    setCost(String(costPerKm).replace(".", ","));
    setDistance(String(maxKm).replace(".", ","));
    setError(null);
    setEditing(true);
  }

  async function save(request: { travelCostPerKm: number | null; maxStoreDistanceKm: number | null }) {
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateHousehold(household.householdId, request));
      setEditing(false);
    } catch (err) {
      setError(describeError(err, { "invalid-argument": tr().householdPage.errors.travel }));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const costValue = Number(cost.replace(",", "."));
    const distanceValue = Number(distance.replace(",", "."));
    if (!(costValue >= 0 && costValue <= 2) || !(distanceValue >= 1 && distanceValue <= 50)) {
      setError(tr().householdPage.errors.travel);
      return;
    }
    void save({ travelCostPerKm: Math.round(costValue * 1000) / 1000, maxStoreDistanceKm: Math.round(distanceValue * 10) / 10 });
  }

  return (
    <div className="settings-row">
      <dt>{tr().householdPage.travel}</dt>
      <dd>
        {!editing ? (
          <>
            <span className="muted">
              {perKmFormat.format(costPerKm)}/km{tr().householdPage.storesUpTo(kmFormat.format(maxKm))}
            </span>
            {isAdmin && (
              <button type="button" className="link-button settings-action" onClick={start}>
                {tr().householdPage.change}
              </button>
            )}
          </>
        ) : (
          <form className="inline-form" onSubmit={handleSubmit}>
            <label>
              <span className="muted">{tr().householdPage.perKm}</span>{" "}
              <input type="text" inputMode="decimal" className="amount-input" value={cost} onChange={(e) => setCost(e.target.value)} />
            </label>
            <label>
              <span className="muted">{tr().householdPage.upToKm}</span>{" "}
              <input type="text" inputMode="decimal" className="amount-input" value={distance} onChange={(e) => setDistance(e.target.value)} />
            </label>
            <button type="submit" className="button-primary" disabled={busy}>
              {tr().common.save}
            </button>
            <button type="button" className="link-button" disabled={busy} onClick={() => void save({ travelCostPerKm: null, maxStoreDistanceKm: null })}>
              {tr().householdPage.defaults}
            </button>
            <button type="button" className="link-button" onClick={() => setEditing(false)}>
              {tr().common.cancel}
            </button>
            {error && (
              <span className="form-error" role="alert">
                {error}
              </span>
            )}
          </form>
        )}
      </dd>
    </div>
  );
}
