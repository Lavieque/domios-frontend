import { useState } from "react";
import { useLoad } from "../useLoad";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { getSpending, type SpendingMonthDto } from "../api/spending";
import { ChainLogo } from "../components/ChainLogo";
import { HouseholdGate } from "../household/HouseholdGate";
import { monthLabel, periodFor } from "../shopping/spending";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const money = numberFormat({ style: "currency", currency: "EUR" });

/** Períodos que a página oferece; a Api aceita até 24 meses. */
const periods = [3, 6, 12] as const;

export function SpendingPage() {
  return <HouseholdGate>{(household) => <Spending household={household} />}</HouseholdGate>;
}

/** O que a casa gastou por mês e por cadeia: o escrito por um membro e o estimado pela prateleira. */
function Spending({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const [months, setMonths] = useState<number>(6);
  const { data: spending, error } = useLoad([householdId, months], () => {
    const { from, to } = periodFor(months);
    return getSpending(householdId, from, to);
  });

  // Mais recentes primeiro; os meses sem nada não aparecem.
  const shown = spending ? [...spending.months].filter((m) => m.total > 0 || m.purchasesWithoutPrice > 0).reverse() : [];

  return (
    <div className="page spending-page">
      <nav className="crumb" aria-label={tr().common.breadcrumb}>
        <Link to="/listas" className="back-link">
          {tr().spending.back}
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>{tr().spending.title}</h1>
          <p className="page-head-sub">{tr().spending.subtitle(household.name)}</p>
        </div>
        <select className="category-select" aria-label={tr().spending.period} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {periods.map((p) => (
            <option key={p} value={p}>
              {tr().spending.lastMonths(p)}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!spending && !error && <p className="muted loading">{tr().common.loading}</p>}

      {spending && (
        <>
          <section className="panel spending-summary">
            <div>
              <span className="muted">{tr().spending.total}</span>
              <div className="price-tag">{money.format(spending.total)}</div>
            </div>
            {spending.estimated > 0 && (
              <p className="muted">
                {tr().spending.estimated(money.format(spending.estimated), money.format(spending.typed))}
              </p>
            )}
            {spending.purchasesWithoutPrice > 0 && (
              <p className="muted">
                {tr().spending.withoutPrice(spending.purchasesWithoutPrice)}
              </p>
            )}
          </section>

          {shown.length === 0 ? (
            <p className="empty-state">
              {tr().spending.empty.before} <Link to="/listas">{tr().spending.empty.link}</Link> {tr().spending.empty.after}
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
        <p className="muted">{tr().spending.moreWithoutPrice(month.purchasesWithoutPrice)}</p>
      )}
      <ul className="spending-chains">
        {month.chains.map((chain) => (
          <li key={chain.chainId ?? "none"}>
            {chain.chainName ? <ChainLogo chainName={chain.chainName} size="sm" /> : <span aria-hidden="true" />}
            <span>
              {chain.chainName ?? tr().spending.noStore}{" "}
              <span className="muted">
                · {tr().spending.purchases(chain.purchases)}
                {chain.estimated > 0 && chain.typed > 0 && tr().spending.estimatedPart(money.format(chain.estimated))}
                {chain.estimated > 0 && chain.typed === 0 && tr().spending.estimatedOnly}
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
