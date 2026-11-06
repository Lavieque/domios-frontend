import { useState, type FormEvent } from "react";
import { admin, type AdminUser } from "../api";
import { ConfirmAction, PageHead, Pager, State } from "../components";
import { dateTime, useLoad } from "../hooks";

export function UsersPage({ selfId }: { selfId: string }) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useLoad(() => admin.users(search, page), [search, page]);
  const items = list.data?.items ?? [];

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch(draft.trim());
    setPage(1);
  }

  return (
    <>
      <PageHead title="Utilizadores" sub="Contas da plataforma. Desativar termina as sessões e impede novo login." />
      <form className="search" onSubmit={submit} role="search">
        <input type="search" aria-label="Procurar por email" placeholder="Procurar por email…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="button-secondary">
          Procurar
        </button>
      </form>
      {list.data && (
        <p className="count">
          {list.data.total} {list.data.total === 1 ? "utilizador" : "utilizadores"}
        </p>
      )}

      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem utilizadores." />

      {items.length > 0 && (
        <ul className="rows">
          {items.map((u) => (
            <UserRow key={u.id} user={u} isSelf={u.id === selfId} onChanged={list.reload} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function UserRow({ user: u, isSelf, onChanged }: { user: AdminUser; isSelf: boolean; onChanged: () => void }) {
  const act = (fn: () => Promise<unknown>) => async () => {
    await fn();
    onChanged();
  };
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{u.email}</strong>
          {isSelf && <span className="muted">(tu)</span>}
        </div>
        <p className="row-meta">
          Criado a {dateTime.format(new Date(u.createdAt))} · {u.lastLoginAt ? `último login a ${dateTime.format(new Date(u.lastLoginAt))}` : "nunca entrou"}
        </p>
      </div>
      <div className="row-state">
        {u.isPlatformAdmin && <span className="pill pill-navy">Administrador</span>}
        <span className={`pill ${u.emailVerified ? "pill-good" : "pill-muted"}`}>{u.emailVerified ? "Email confirmado" : "Email por confirmar"}</span>
        {u.isDisabled && <span className="pill pill-danger">Desativado</span>}
      </div>
      <div className="row-actions">
        <ConfirmAction label="Terminar sessões" confirmLabel="Terminar todas as sessões" onConfirm={act(() => admin.revokeSessions(u.id))} />
        {u.isDisabled ? (
          <ConfirmAction label="Reativar" confirmLabel="Reativar conta" onConfirm={act(() => admin.enable(u.id))} />
        ) : (
          <ConfirmAction label="Desativar" confirmLabel="Desativar conta" tone="danger" disabled={isSelf} onConfirm={act(() => admin.disable(u.id))} />
        )}
      </div>
    </li>
  );
}
