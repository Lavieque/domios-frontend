import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { discardReasonLabels, getPantryWaste, type PantryWasteDto } from "../api/pantry";
import { measurementUnitLabels } from "../api/types";
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { periodFor } from "../shopping/spending";

const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short" });

/** A Api aceita até 366 dias. */
const periods = [
  { months: 1, label: "Este mês" },
  { months: 3, label: "Últimos 3 meses" },
  { months: 12, label: "Últimos 12 meses" },
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
      <nav className="crumb" aria-label="Caminho">
        <Link to="/despensa" className="back-link">
          Despensa
        </Link>
      </nav>
      <header className="page-head">
        <div>
          <h1>Desperdício</h1>
          <p className="page-head-sub">O que se deitou fora em {household.name}</p>
        </div>
        <select className="category-select" aria-label="Período" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {periods.map((p) => (
            <option key={p.months} value={p.months}>
              {p.label}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!waste && !error && <p className="muted loading">A carregar…</p>}

      {waste && (
        <>
          <section className="panel spending-summary">
            <div>
              <span className="muted">Deitado fora</span>
              <div className="price-tag">
                {waste.discardedItemCount === 1 ? "1 artigo" : `${waste.discardedItemCount} artigos`}
              </div>
            </div>
            {waste.wastePercent !== null && (
              <div>
                <span className="muted">Do que se acabou</span>
                <div className="price-tag">{waste.wastePercent.toLocaleString("pt-PT")} %</div>
              </div>
            )}
            {waste.estimatedValue && (
              <div>
                <span className="muted">Valia cerca de</span>
                <div className="price-tag">{money.format(waste.estimatedValue.amount)}</div>
              </div>
            )}
            {waste.estimatedValue && waste.valuedItemCount < waste.discardedItemCount && (
              <p className="muted">
                Valor de {waste.valuedItemCount} de {waste.discardedItemCount}: os outros não têm preço de compra.
              </p>
            )}
          </section>

          {waste.items.length === 0 ? (
            <p className="empty-state">Nada deitado fora neste período.</p>
          ) : (
            <>
              <div className="waste-groups">
                <section className="panel">
                  <h2>Porquê</h2>
                  <ul className="waste-list">
                    {waste.byReason.map((r) => (
                      <li key={String(r.reason)}>
                        <span>{r.reason === null ? "Sem motivo" : discardReasonLabels[r.reason]}</span>
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
                    <h2>O quê</h2>
                    <ul className="waste-list">
                      {waste.byCategory.map((c) => (
                        <li key={c.categoryId ?? "none"}>
                          <span>{c.name}</span>
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
                <h2>Artigos</h2>
                <ul className="waste-list">
                  {waste.items.map((item) => (
                    <li key={item.pantryItemId}>
                      <span>
                        <Link to={`/produtos/${item.productId}`}>{item.productName}</Link>{" "}
                        <span className="muted">
                          {quantityFormat.format(item.quantity.amount)} {measurementUnitLabels[item.quantity.unit]} ·{" "}
                          {item.reason === null ? "sem motivo" : discardReasonLabels[item.reason].toLowerCase()}
                        </span>
                      </span>
                      <span className="muted">
                        {dateFormat.format(new Date(item.discardedAt))}
                        {item.estimatedValue && ` · ${money.format(item.estimatedValue.amount)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="muted">"Registado por engano" não conta no total nem na percentagem.</p>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
