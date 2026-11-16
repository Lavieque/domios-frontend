import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { discardReasonLabels, getPantryWaste, type PantryWasteDto } from "../api/pantry";
import { measurementUnitLabels } from "../api/types";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { periodFor } from "../shopping/spending";
import { dateTimeFormat, localeOf, numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const money = numberFormat({ style: "currency", currency: "EUR" });
const quantityFormat = numberFormat({ maximumFractionDigits: 2 });
const dateFormat = dateTimeFormat({ day: "numeric", month: "short" });

/** A Api aceita até 366 dias. */
const periods = [
  { months: 1, label: "thisMonth" },
  { months: 3, label: "last3" },
  { months: 12, label: "last12" },
] as const;

export function PantryWastePage() {
  return <HouseholdGate>{(household) => <Waste household={household} />}</HouseholdGate>;
}

/** O que foi para o lixo, quanto valia e porquê (adenda 2026-11-09 de DomiOS_API_Fase4.md, D.5). */
function Waste({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const [months, setMonths] = useState<number>(1);
  const [waste, setWaste] = useState<PantryWasteDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setWaste(null);
    setError(null);
    const { from, to } = periodFor(months);
    getPantryWaste(householdId, from, to)
      .then((result) => active && setWaste(result))
      .catch((err) => active && setError(describeError(err)));
    return () => {
      active = false;
    };
  }, [householdId, months]);

  return (
    <div className="page waste-page">
      <nav className="crumb" aria-label={tr().common.breadcrumb}>
        <Link to="/despensa" className="back-link">
          {tr().waste.back}
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>{tr().waste.title}</h1>
          <p className="page-head-sub">{tr().waste.subtitle(household.name)}</p>
        </div>
        <select className="category-select" aria-label={tr().spending.period} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {periods.map((p) => (
            <option key={p.months} value={p.months}>
              {tr().waste[p.label]}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!waste && !error && <p className="muted loading">{tr().common.loading}</p>}

      {waste && (
        <>
          <section className="panel spending-summary">
            <div>
              <span className="muted">{tr().waste.thrownAway}</span>
              <div className="price-tag">
                {tr().waste.items(waste.discardedItemCount)}
              </div>
            </div>
            {waste.wastePercent !== null && (
              <div>
                <span className="muted">{tr().waste.ofFinished}</span>
                <div className="price-tag">{waste.wastePercent.toLocaleString(localeOf())} %</div>
              </div>
            )}
            {waste.estimatedValue && (
              <div>
                <span className="muted">{tr().waste.worth}</span>
                <div className="price-tag">{money.format(waste.estimatedValue.amount)}</div>
              </div>
            )}
            {waste.estimatedValue && waste.valuedItemCount < waste.discardedItemCount && (
              <p className="muted">
                {tr().waste.valued(waste.valuedItemCount, waste.discardedItemCount)}
              </p>
            )}
          </section>

          {waste.items.length === 0 ? (
            <p className="empty-state">{tr().waste.none}</p>
          ) : (
            <>
              <div className="waste-groups">
                <section className="panel">
                  <h2>{tr().waste.why}</h2>
                  <ul className="waste-list">
                    {waste.byReason.map((r) => (
                      <li key={String(r.reason)}>
                        <span>{r.reason === null ? tr().waste.noReason : discardReasonLabels[r.reason]}</span>
                        <span className="muted">
                          {r.itemCount}
                          {r.estimatedValue && ` · ${money.format(r.estimatedValue.amount)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                {waste.byCategory.length > 0 && (
                  <section className="panel">
                    <h2>{tr().waste.what}</h2>
                    <ul className="waste-list">
                      {waste.byCategory.map((c) => (
                        <li key={c.categoryId ?? "none"}>
                          <span>{c.categoryId === null || c.name === null ? tr().waste.noCategory : c.name}</span>
                          <span className="muted">
                            {c.itemCount}
                            {c.estimatedValue && ` · ${money.format(c.estimatedValue.amount)}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <section className="panel">
                <h2>{tr().waste.articles}</h2>
                <ul className="waste-list">
                  {waste.items.map((item) => (
                    <li key={item.pantryItemId}>
                      <span>
                        <Link to={`/produtos/${item.productId}`}>{item.productName ?? tr().waste.unknownProduct}</Link>{" "}
                        <span className="muted">
                          {quantityFormat.format(item.quantity.amount)} {measurementUnitLabels[item.quantity.unit]} ·{" "}
                          {item.reason === null ? tr().waste.noReasonInline : discardReasonLabels[item.reason].toLowerCase()}
                        </span>
                      </span>
                      <span className="muted">
                        {dateFormat.format(new Date(item.discardedAt))}
                        {item.estimatedValue && ` · ${money.format(item.estimatedValue.amount)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="muted">{tr().waste.mistakeNote}</p>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
