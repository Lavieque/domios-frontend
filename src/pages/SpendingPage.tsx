import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { getSpending, type SpendingDto, type SpendingMonthDto } from "../api/spending";
import { describeError } from "../auth/errors";
import { ChainLogo } from "../components/ChainLogo";
import { HouseholdGate } from "../household/HouseholdGate";
import { monthLabel, periodFor } from "../shopping/spending";

const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

/** Períodos que a página oferece; a Api aceita até 24 meses. */
const periods = [
  { months: 3, label: "3 meses" },
  { months: 6, label: "6 meses" },
  { months: 12, label: "12 meses" },
] as const;

export function SpendingPage() {
  return <HouseholdGate>{(household) => <Spending household={household} />}</HouseholdGate>;
}

/** O que a casa gastou por mês e por cadeia: o escrito por um membro e o estimado pela prateleira. */
function Spending({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const [months, setMonths] = useState<number>(6);
  const [spending, setSpending] = useState<SpendingDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSpending(null);
    setError(null);
    const { from, to } = periodFor(months);
    getSpending(householdId, from, to)
      .then((result) => active && setSpending(result))
      .catch((err) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [householdId, months]);

  // Mais recentes primeiro; os meses sem nada não aparecem.
  const shown = spending ? [...spending.months].filter((m) => m.total > 0 || m.purchasesWithoutPrice > 0).reverse() : [];

  return (
    <div className="page spending-page">
      <nav className="crumb" aria-label="Caminho">
        <Link to="/listas" className="back-link">
          Listas de compras
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>Gastos</h1>
          <p className="page-head-sub">O que se comprou em {household.name}, por mês e por loja</p>
        </div>
        <select className="category-select" aria-label="Período" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {periods.map((p) => (
            <option key={p.months} value={p.months}>
              Últimos {p.label}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!spending && !error && <p className="muted loading">A carregar…</p>}

      {spending && (
        <>
          <section className="panel spending-summary">
            <div>
              <span className="muted">Total</span>
              <div className="price-tag">{money.format(spending.total)}</div>
            </div>
            {spending.estimated > 0 && (
              <p className="muted">
                {money.format(spending.estimated)} pelo preço da prateleira no dia da compra; {money.format(spending.typed)} escrito por vocês.
              </p>
            )}
            {spending.purchasesWithoutPrice > 0 && (
              <p className="muted">
                {spending.purchasesWithoutPrice === 1 ? "1 compra sem preço" : `${spending.purchasesWithoutPrice} compras sem preço`} fora do total:
                escolhe a loja da lista ou escreve quanto pagaste.
              </p>
            )}
          </section>

          {shown.length === 0 ? (
            <p className="empty-state">
              Ainda não há compras neste período. Marca os itens de uma <Link to="/listas">lista</Link> como comprados e escolhe a loja: o preço
              entra aqui.
            </p>
          ) : (
            shown.map((month) => <Month key={month.month} month={month} />)
          )}
        </>
      )}
    </div>
  );
}

function Month({ month }: { month: SpendingMonthDto }) {
  const largest = Math.max(...month.chains.map((c) => c.total), 0);
  return (
    <section className="panel spending-month">
      <h2>
        <span>{monthLabel(month.month)}</span>
        <span className="price-tag">{money.format(month.total)}</span>
      </h2>
      {month.purchasesWithoutPrice > 0 && (
        <p className="muted">{month.purchasesWithoutPrice === 1 ? "Mais 1 compra sem preço." : `Mais ${month.purchasesWithoutPrice} compras sem preço.`}</p>
      )}
      <ul className="spending-chains">
        {month.chains.map((chain) => (
          <li key={chain.chainId ?? "none"}>
            {chain.chainName ? <ChainLogo chainName={chain.chainName} size="sm" /> : <span aria-hidden="true" />}
            <span>
              {chain.chainName ?? "Sem loja"}{" "}
              <span className="muted">
                · {chain.purchases === 1 ? "1 compra" : `${chain.purchases} compras`}
                {chain.estimated > 0 && chain.typed > 0 && `, ${money.format(chain.estimated)} estimado`}
                {chain.estimated > 0 && chain.typed === 0 && ", estimado"}
              </span>
            </span>
            <strong>{money.format(chain.total)}</strong>
            {largest > 0 && <span className="spending-bar" style={{ width: `${(chain.total / largest) * 100}%` }} aria-hidden="true" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
