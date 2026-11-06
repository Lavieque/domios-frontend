import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { admin, type HouseholdRow } from "../api";
import { PageHead, Pager, State } from "../components";
import { dateOnly, useLoad } from "../hooks";

export function HouseholdsPage() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useLoad(() => admin.households(search, page), [search, page]);
  const items = list.data?.items ?? [];

  function submit(event: FormEvent) {
    event.preventDefault();
    setSearch(draft.trim());
    setPage(1);
  }

  return (
    <>
      <PageHead title="Casas" sub="Todas as casas da plataforma. Abre uma para ver os membros e corrigir o que for preciso." />
      <form className="search" onSubmit={submit} role="search">
        <input type="search" aria-label="Procurar por nome da casa" placeholder="Procurar por nome da casa…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="button-secondary">
          Procurar
        </button>
      </form>
      {list.data && (
        <p className="count">
          {list.data.total} {list.data.total === 1 ? "casa" : "casas"}
        </p>
      )}

      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem casas." />

      {items.length > 0 && (
        <ul className="rows">
          {items.map((h) => (
            <HouseholdListRow key={h.householdId} household={h} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function HouseholdListRow({ household: h }: { household: HouseholdRow }) {
  return (
    <li className="row row-link-row">
      <div className="row-main">
        <div className="row-title">
          <Link to={`/casas/${h.householdId}`} className="row-link-name">
            {h.name}
          </Link>
        </div>
        <p className="row-meta">
          Criada a {dateOnly.format(new Date(h.createdAt))} · {h.timeZone} · {h.currency}
        </p>
      </div>
      <div className="row-state">
        <span className="pill pill-muted">
          {h.memberCount} {h.memberCount === 1 ? "membro" : "membros"}
        </span>
        <span className="pill pill-navy">
          {h.adminCount} {h.adminCount === 1 ? "administrador" : "administradores"}
        </span>
        <span className={`pill ${h.linkedMemberCount > 0 ? "pill-good" : "pill-danger"}`}>
          {h.linkedMemberCount} com conta
        </span>
      </div>
      <div className="row-actions">
        <Link to={`/casas/${h.householdId}`} className="row-action">
          Abrir
        </Link>
      </div>
    </li>
  );
}
