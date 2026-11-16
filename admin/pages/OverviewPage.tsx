import { Link } from "react-router-dom";
import { admin, type AccessRequest, type AuditEntry, type Freshness, type SystemStatus } from "../api";
import { Avatar, ConfirmAction, PageHead, State } from "../components";
import { dateTime, useLoad } from "../hooks";

const number = new Intl.NumberFormat("pt-PT");

const AUDIT_ACTIONS: Record<string, string> = {
  "access-request.approve": "Aprovou um pedido",
  "access-request.resend-invite": "Reenviou um convite",
  "access-request.reject": "Rejeitou um pedido",
  "user.disable": "Desativou um utilizador",
  "user.enable": "Reativou um utilizador",
  "user.revoke-sessions": "Terminou sessões",
  "household.rename": "Mudou o nome de uma casa",
  "household.member-role": "Mudou o papel de um membro",
  "household.member-remove": "Removeu um membro de uma casa",
  "catalog.write": "Alterou o catálogo",
};

/** Dias desde a última alteração; a recolha de preços parada é o problema que mais custa a ver. */
function daysSince(iso: string | null, now: number): number | null {
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86_400_000)) : null;
}

function freshness(f: Freshness, now: number): { text: string; pill: string } {
  const days = daysSince(f.lastUpdatedAt, now);
  if (days === null) return { text: "Sem dados", pill: "pill-danger" };
  if (days === 0) return { text: "Hoje", pill: "pill-good" };
  if (days <= 2) return { text: `Há ${days} ${days === 1 ? "dia" : "dias"}`, pill: "pill-good" };
  return { text: `Há ${days} dias`, pill: days <= 7 ? "pill-warn" : "pill-danger" };
}

export function OverviewPage() {
  const system = useLoad(() => admin.system(), []);
  const requests = useLoad(() => admin.accessRequests("Pending", 1), []);
  const audit = useLoad(() => admin.audit(undefined, 1), []);
  const s = system.data;

  return (
    <>
      <PageHead title="Visão geral" sub="O que precisa de ti, o estado da plataforma e o que mudou por último." />

      {system.error && <State loading={false} error={system.error} empty={false} emptyText="" />}

      {s && <Pulse s={s} />}

      <div className="split">
        <section className="panel" aria-labelledby="ov-pending">
          <div className="panel-head">
            <h2 id="ov-pending">Pedidos por avaliar</h2>
            <Link to="/pedidos">Ver todos</Link>
          </div>
          <State loading={requests.loading} error={requests.error} empty={(requests.data?.items.length ?? 0) === 0} emptyText="Nada à espera: todos os pedidos estão decididos." />
          {(requests.data?.items.length ?? 0) > 0 && (
            <ul className="rows">
              {requests.data!.items.slice(0, 5).map((r) => (
                <PendingRow key={r.id} request={r} onChanged={() => { requests.reload(); system.reload(); }} />
              ))}
            </ul>
          )}
          {requests.data && requests.data.total > 5 && <p className="note-muted">E mais {requests.data.total - 5} na lista de pedidos.</p>}
        </section>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          <section className="panel" aria-labelledby="ov-health">
            <div className="panel-head">
              <h2 id="ov-health">Estado</h2>
              <Link to="/sistema">Detalhe</Link>
            </div>
            {s ? <Health s={s} /> : <State loading={system.loading} error={null} empty emptyText="Sem dados." />}
          </section>

          <section className="panel" aria-labelledby="ov-audit">
            <div className="panel-head">
              <h2 id="ov-audit">Últimas ações</h2>
              <Link to="/auditoria">Auditoria</Link>
            </div>
            <State loading={audit.loading} error={audit.error} empty={(audit.data?.items.length ?? 0) === 0} emptyText="Ainda sem registos." />
            {(audit.data?.items.length ?? 0) > 0 && (
              <ul className="quiet-list">
                {audit.data!.items.slice(0, 6).map((a: AuditEntry) => (
                  <li key={a.id}>
                    <span>
                      {AUDIT_ACTIONS[a.action] ?? a.action}
                      <span className="muted"> · {a.actorEmail ?? "conta removida"}</span>
                    </span>
                    <time className="row-time" dateTime={a.at}>
                      {dateTime.format(new Date(a.at))}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/** Contagens que levam à lista que as explica; nada aqui é inventado, tudo vem de /admin/system. */
function Pulse({ s }: { s: SystemStatus }) {
  const items = [
    { to: "/utilizadores", value: s.accounts.users, label: "Utilizadores", note: `${s.accounts.disabledUsers} desativados · ${s.accounts.platformAdmins} admin` },
    { to: "/casas", value: s.accounts.households, label: "Casas", note: `${number.format(s.accounts.activeSessions)} sessões ativas` },
    { to: "/catalogo/produtos", value: s.catalog.products.count, label: "Produtos", note: `${number.format(s.catalog.offers.count)} ofertas por loja` },
    { to: "/catalogo/receitas", value: s.catalog.recipes.count, label: "Receitas", note: "no catálogo" },
    { to: "/catalogo/promocoes", value: s.catalog.activePromotions, label: "Promoções ativas", note: "recolhidas das lojas" },
  ];
  return (
    <div className="pulse">
      {items.map((i) => (
        <Link key={i.to} to={i.to} className="pulse-item">
          <span className="pulse-value">{number.format(i.value)}</span>
          <span className="pulse-label">{i.label}</span>
          <span className="pulse-note">{i.note}</span>
        </Link>
      ))}
    </div>
  );
}

function Health({ s }: { s: SystemStatus }) {
  const now = new Date(s.generatedAt).getTime();
  const prices = freshness(s.catalog.offers, now);
  const rows: { label: string; pill: string; text: string; note?: string }[] = [
    { label: "Base de dados", pill: s.database.ok ? "pill-good" : "pill-danger", text: s.database.ok ? "Ligada" : "Sem ligação", note: `${s.database.latencyMs} ms` },
    {
      label: "Email",
      pill: s.email.sender === "Logging" ? "pill-muted" : s.email.configured ? "pill-good" : "pill-danger",
      text: s.email.sender === "Logging" ? "Só log" : s.email.configured ? "Ativo" : "Desligado",
      note: s.email.pending > 0 ? `${s.email.pending} na fila` : undefined,
    },
    { label: "Aviso de pedidos", pill: s.email.adminNotifyEmail ? "pill-good" : "pill-danger", text: s.email.adminNotifyEmail ? "Ativo" : "Ninguém avisado" },
    { label: "Preços", pill: prices.pill, text: prices.text, note: "última recolha" },
    { label: "Ambiente", pill: "pill-muted", text: s.environment, note: `v${s.version}` },
  ];
  return (
    <dl className="health">
      {rows.map((r) => (
        <div className="health-row" key={r.label}>
          <dt>{r.label}</dt>
          <dd>
            {r.note}
            <span className={`pill ${r.pill}`}>{r.text}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PendingRow({ request: r, onChanged }: { request: AccessRequest; onChanged: () => void }) {
  const act = (fn: () => Promise<unknown>) => async () => {
    await fn();
    onChanged();
  };
  return (
    <li className="row">
      <Avatar name={r.name} />
      <div className="row-main">
        <div className="row-title">
          <strong>{r.name}</strong>
          <span className="muted">{r.email}</span>
        </div>
        {r.message && <p className="row-note">{r.message}</p>}
        <p className="row-meta">Pedido a {dateTime.format(new Date(r.createdAt))}</p>
      </div>
      <div className="row-state" />
      <div className="row-actions">
        <ConfirmAction label="Aprovar" confirmLabel="Aprovar e enviar convite" onConfirm={act(() => admin.approve(r.id))} />
        <ConfirmAction label="Rejeitar" confirmLabel="Rejeitar e avisar" tone="danger" onConfirm={act(() => admin.reject(r.id))} />
      </div>
    </li>
  );
}
