import { useState } from "react";
import { admin, type AccessRequest } from "../api";
import { ConfirmAction, PageHead, Pager, State } from "../components";
import { dateTime, useLoad } from "../hooks";

const FILTERS = [
  { value: "Pending", label: "Pendentes" },
  { value: "Approved", label: "Aprovados" },
  { value: "Rejected", label: "Rejeitados" },
  { value: "", label: "Todos" },
] as const;

const STATUS: Record<AccessRequest["status"], { label: string; pill: string }> = {
  Pending: { label: "Pendente", pill: "pill-navy" },
  Approved: { label: "Aprovado", pill: "pill-good" },
  Rejected: { label: "Rejeitado", pill: "pill-muted" },
};

export function RequestsPage() {
  const [status, setStatus] = useState<string>("Pending");
  const [page, setPage] = useState(1);
  const list = useLoad(() => admin.accessRequests(status || undefined, page), [status, page]);
  const items = list.data?.items ?? [];

  return (
    <>
      <PageHead title="Pedidos de acesso" sub="Aprovar envia o convite por email. Rejeitar envia uma resposta neutra." />
      <div className="chip-row" role="group" aria-label="Estado">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className="chip"
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem pedidos neste estado." />

      {items.length > 0 && (
        <ul className="rows">
          {items.map((r) => (
            <RequestRow key={r.id} request={r} onChanged={list.reload} />
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}

function RequestRow({ request: r, onChanged }: { request: AccessRequest; onChanged: () => void }) {
  const s = STATUS[r.status];
  const act = (fn: () => Promise<unknown>) => async () => {
    await fn();
    onChanged();
  };
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <strong>{r.name}</strong>
          <span className="muted">{r.email}</span>
        </div>
        {r.message && <p className="row-note">{r.message}</p>}
        <p className="row-meta">
          Pedido a {dateTime.format(new Date(r.createdAt))} · {r.language.toUpperCase()}
          {r.status === "Approved" && r.inviteExpiresAt && !r.inviteUsed && <> · convite válido até {dateTime.format(new Date(r.inviteExpiresAt))}</>}
        </p>
      </div>
      <div className="row-state">
        <span className={`pill ${s.pill}`}>{s.label}</span>
        {r.inviteUsed && <span className="pill pill-good">Conta criada</span>}
      </div>
      <div className="row-actions">
        {r.status === "Pending" && (
          <>
            <ConfirmAction label="Aprovar" confirmLabel="Aprovar e enviar convite" onConfirm={act(() => admin.approve(r.id))} />
            <ConfirmAction label="Rejeitar" confirmLabel="Rejeitar e avisar" tone="danger" onConfirm={act(() => admin.reject(r.id))} />
          </>
        )}
        {r.status === "Approved" && !r.inviteUsed && (
          <ConfirmAction label="Reenviar convite" confirmLabel="Enviar novo convite" onConfirm={act(() => admin.resendInvite(r.id))} />
        )}
      </div>
    </li>
  );
}
