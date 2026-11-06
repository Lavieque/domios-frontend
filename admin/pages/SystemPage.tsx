import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { admin, type Freshness } from "../api";
import { PageHead, State } from "../components";
import { dateTime, useLoad } from "../hooks";

const number = new Intl.NumberFormat("pt-PT");

/** Há quanto tempo foi, em palavras. A data exata vai na descrição ao lado. */
function ago(iso: string | null, now: number): string {
  if (!iso) return "nunca";
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 2) return "agora mesmo";
  if (minutes < 120) return `há ${minutes} minutos`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `há ${hours} horas`;
  return `há ${Math.round(hours / 24)} dias`;
}

export function SystemPage() {
  const load = useLoad(() => admin.system(), []);
  const s = load.data;
  const now = s ? new Date(s.generatedAt).getTime() : 0;

  return (
    <>
      <PageHead title="Sistema" sub="O estado da plataforma neste momento. Só leitura.">
        <div className="refresh">
          {s && <span className="muted">Atualizado a {dateTime.format(new Date(s.generatedAt))}</span>}
          <button type="button" className="button-secondary" disabled={load.loading} onClick={load.reload}>
            {load.loading ? "A atualizar…" : "Atualizar"}
          </button>
        </div>
      </PageHead>

      <State loading={load.loading} error={load.error} empty={!s} emptyText="Sem dados." />

      {s && (
        <>
          <h2>Serviço</h2>
          <dl className="facts">
            <Fact label="Base de dados" value={s.database.ok ? "Ligada" : "Sem ligação"} detail={`Resposta em ${s.database.latencyMs} ms`} pill={s.database.ok ? "pill-good" : "pill-danger"} />
            <Fact label="Ambiente" value={s.environment} detail={`Versão ${s.version}`} />
            <Fact
              label="Email"
              value={s.email.sender}
              detail={
                s.email.sender === "Logging"
                  ? "Desenvolvimento: os emails só ficam no log da Api."
                  : s.email.configured
                    ? `Remetente ${s.email.fromAddress ?? "por definir"}`
                    : "Sem fornecedor configurado: nenhum email sai."
              }
              pill={s.email.sender === "Logging" ? "pill-muted" : s.email.configured ? "pill-good" : "pill-danger"}
              pillText={s.email.sender === "Logging" ? "Só log" : s.email.configured ? "Ativo" : "Desligado"}
              extra={s.email.pending > 0 ? `${s.email.pending} na fila` : undefined}
            />
          </dl>

          <h2>Contas</h2>
          <dl className="facts">
            <Fact label="Utilizadores" value={number.format(s.accounts.users)} detail={`${s.accounts.disabledUsers} desativados · ${s.accounts.platformAdmins} administradores`} />
            <Fact label="Sessões ativas" value={number.format(s.accounts.activeSessions)} detail="Sessões abertas que ainda não expiraram nem foram terminadas." />
            <Fact label="Casas" value={number.format(s.accounts.households)} />
            <Fact
              label="Pedidos por avaliar"
              value={number.format(s.accounts.pendingAccessRequests)}
              detail="Pedidos de acesso à espera de decisão."
              pill={s.accounts.pendingAccessRequests > 0 ? "pill-navy" : undefined}
              pillText="Ver pedidos"
              href="/pedidos"
            />
          </dl>

          <h2>Catálogo</h2>
          <p className="note-muted">O que a recolha de preços deixou na base de dados. Se uma data estiver muito atrasada, a recolha parou.</p>
          <dl className="facts">
            <Freshened label="Produtos" f={s.catalog.products} now={now} />
            <Freshened label="Ofertas por loja" f={s.catalog.offers} now={now} />
            <Fact
              label="Promoções ativas"
              value={number.format(s.catalog.activePromotions)}
              detail={`Última alteração ${ago(s.catalog.promotionsLastUpdatedAt, now)}${s.catalog.promotionsLastUpdatedAt ? ` (${dateTime.format(new Date(s.catalog.promotionsLastUpdatedAt))})` : ""}`}
            />
            <Freshened label="Receitas" f={s.catalog.recipes} now={now} />
          </dl>
        </>
      )}
    </>
  );
}

function Freshened({ label, f, now }: { label: string; f: Freshness; now: number }) {
  return (
    <Fact
      label={label}
      value={number.format(f.count)}
      detail={`Última alteração ${ago(f.lastUpdatedAt, now)}${f.lastUpdatedAt ? ` (${dateTime.format(new Date(f.lastUpdatedAt))})` : ""}`}
    />
  );
}

function Fact({
  label,
  value,
  detail,
  pill,
  pillText,
  extra,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  pill?: string;
  pillText?: string;
  extra?: string;
  href?: string;
}): ReactNode {
  const badge = pill ? (
    href ? (
      <Link className={`pill ${pill}`} to={href}>
        {pillText}
      </Link>
    ) : (
      <span className={`pill ${pill}`}>{pillText ?? value}</span>
    )
  ) : null;
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>
        <span className="fact-value">{value}</span>
        {detail && <> · {detail}</>}
        {extra && <> · {extra}</>}
      </dd>
      <dd>{badge}</dd>
    </div>
  );
}
