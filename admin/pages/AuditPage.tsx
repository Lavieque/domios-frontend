import { useState } from "react";
import { admin } from "../api";
import { PageHead, Pager, State } from "../components";
import { dateTime, useLoad } from "../hooks";

const FILTERS = [
  { value: "", label: "Tudo" },
  { value: "access-request", label: "Pedidos" },
  { value: "user", label: "Utilizadores" },
  { value: "household", label: "Casas" },
  { value: "catalog", label: "Catálogo" },
] as const;

const ACTIONS: Record<string, string> = {
  "access-request.approve": "Aprovou pedido",
  "access-request.resend-invite": "Reenviou convite",
  "access-request.reject": "Rejeitou pedido",
  "user.disable": "Desativou utilizador",
  "user.enable": "Reativou utilizador",
  "user.revoke-sessions": "Terminou sessões",
  "household.rename": "Mudou o nome de uma casa",
  "household.member-role": "Mudou o papel de um membro",
  "household.member-remove": "Removeu um membro de uma casa",
  "catalog.write": "Alterou o catálogo",
};

export function AuditPage() {
  const [target, setTarget] = useState<string>("");
  const [page, setPage] = useState(1);
  const list = useLoad(() => admin.audit(target || undefined, page), [target, page]);
  const items = list.data?.items ?? [];

  return (
    <>
      <PageHead title="Auditoria" sub="O que cada administrador fez. Só se acrescenta, nunca se apaga." />
      <div className="chip-row" role="group" aria-label="Alvo">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className="chip"
            aria-pressed={target === f.value}
            onClick={() => {
              setTarget(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <State loading={list.loading} error={list.error} empty={items.length === 0} emptyText="Sem registos." />

      {items.length > 0 && (
        <ul className="rows">
          {items.map((a) => (
            <li key={a.id} className="row row-audit">
              <div className="row-main">
                <div className="row-title">
                  <strong>{ACTIONS[a.action] ?? a.action}</strong>
                  <span className="muted">{a.actorEmail ?? a.actorUserId}</span>
                </div>
                <p className="row-meta">
                  {a.targetType} {a.targetId && <code>{a.targetId}</code>}
                  {a.details && (
                    <>
                      {" · "}
                      <code>{a.details}</code>
                    </>
                  )}
                </p>
              </div>
              <time className="row-time" dateTime={a.at}>
                {dateTime.format(new Date(a.at))}
              </time>
            </li>
          ))}
        </ul>
      )}
      {list.data && <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />}
    </>
  );
}
