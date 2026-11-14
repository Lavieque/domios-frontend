import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { getNearbyStores, type NearbyStoresDto } from "../api/nearbyStores";
import { describeError } from "../auth/errors";
import { getDevicePosition, lastDevicePosition, PositionError } from "../catalog/devicePosition";
import { useActiveChains } from "../catalog/useChains";
import { ChainLogo } from "../components/ChainLogo";
import { HouseholdGate } from "../household/HouseholdGate";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const money = numberFormat({ style: "currency", currency: "EUR" });
const kmFormat = numberFormat({ maximumFractionDigits: 1 });

export function NearbyStoresPage() {
  return <HouseholdGate>{(household) => <NearbyStores household={household} />}</HouseholdGate>;
}

/** Lojas físicas das cadeias com preços, a partir da posição do dispositivo (adenda 2026-11-09 de DomiOS_API_Fase5.md, E.1). */
function NearbyStores({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const chains = useActiveChains();
  const [chainId, setChainId] = useState("");
  const [result, setResult] = useState<NearbyStoresDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Só pede a localização depois de um clique; se esta página já a tem, procura logo.
  const [started, setStarted] = useState(() => lastDevicePosition() !== null);

  useEffect(() => {
    if (!started) return;
    let active = true;
    setLoading(true);
    setError(null);
    getDevicePosition()
      .then((origin) => getNearbyStores(householdId, origin, undefined, chainId || undefined))
      .then((found) => active && setResult(found))
      .catch((err) => {
        if (!active) return;
        setError(err instanceof PositionError ? err.message : describeError(err, { "invalid-argument": tr().shoppingList.portugalOnly }));
        if (err instanceof PositionError) setStarted(false);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [householdId, chainId, started]);

  return (
    <div className="page nearby-page">
      <header className="page-head">
        <div>
          <h1>{tr().stores.title}</h1>
          <p className="page-head-sub">{tr().stores.subtitle}</p>
        </div>
        {chains && (
          <select className="category-select" aria-label={tr().stores.chain} value={chainId} onChange={(e) => setChainId(e.target.value)}>
            <option value="">{tr().stores.allChains}</option>
            {chains.map((chain) => (
              <option key={chain.chainId} value={chain.chainId}>
                {chain.name}
              </option>
            ))}
          </select>
        )}
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!started ? (
        <section className="panel">
          <p>{tr().stores.needLocation}</p>
          <button type="button" className="button-primary" onClick={() => setStarted(true)}>
            {tr().stores.useLocation}
          </button>
        </section>
      ) : loading && !result ? (
        <p className="muted loading">{tr().stores.searching}</p>
      ) : (
        result && (
          <>
            <p className="muted">
              {tr().stores.summary(result.stores.length, kmFormat.format(result.radiusKm), money.format(result.costPerKm))}{" "}
              <Link to="/casa">{tr().stores.household}</Link>.
            </p>
            {result.stores.length === 0 ? (
              <p className="empty-state">{tr().stores.none}</p>
            ) : (
              <ul className="nearby-list">
                {result.stores.map((store) => (
                  <li key={store.physicalStoreId} className="nearby-store">
                    <ChainLogo chainName={store.chainName} size="sm" />
                    <div className="nearby-store-text">
                      <strong>{store.name}</strong>
                      {store.address && <span className="muted">{store.address}</span>}
                      {store.openingHours && <span className="muted">{tr().stores.hours(store.openingHours)}</span>}
                    </div>
                    <div className="nearby-store-distance">
                      <strong>{kmFormat.format(store.roadKm)} km</strong>
                      <span className="muted">{tr().stores.roundTrip(money.format(store.travelCost.amount))}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted nearby-attribution">{tr().stores.attribution(result.attribution)}</p>
          </>
        )
      )}
    </div>
  );
}
