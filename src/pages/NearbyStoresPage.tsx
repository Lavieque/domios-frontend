import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CallerHouseholdDto } from "../api/households";
import { getNearbyStores, type NearbyStoresDto } from "../api/nearbyStores";
import { describeError } from "../auth/errors";
import { getDevicePosition, lastDevicePosition, PositionError } from "../catalog/devicePosition";
import { useActiveChains } from "../catalog/useChains";
import { ChainLogo } from "../components/ChainLogo";
import { HouseholdGate } from "../household/HouseholdGate";

const money = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const kmFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });

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
        setError(err instanceof PositionError ? err.message : describeError(err, { "invalid-argument": "As lojas só existem em Portugal." }));
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
          <h1>Lojas perto</h1>
          <p className="page-head-sub">Supermercados com preços no DomiOS, o mais perto primeiro, com o custo de ir e voltar</p>
        </div>
        {chains && (
          <select className="category-select" aria-label="Cadeia" value={chainId} onChange={(e) => setChainId(e.target.value)}>
            <option value="">Todas as cadeias</option>
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
          <p>Para mostrar as lojas perto, o DomiOS precisa da localização deste dispositivo. Usa-a só neste pedido e não a guarda.</p>
          <button type="button" className="button-primary" onClick={() => setStarted(true)}>
            Usar a minha localização
          </button>
        </section>
      ) : loading && !result ? (
        <p className="muted loading">A procurar lojas…</p>
      ) : (
        result && (
          <>
            <p className="muted">
              {result.stores.length === 1 ? "1 loja" : `${result.stores.length} lojas`} a menos de {kmFormat.format(result.radiusKm)} km · deslocação a{" "}
              {money.format(result.costPerKm)}/km. O raio e o custo por km mudam-se em <Link to="/casa">Casa</Link>.
            </p>
            {result.stores.length === 0 ? (
              <p className="empty-state">Nenhuma loja no raio. Aumenta a distância máxima em Casa.</p>
            ) : (
              <ul className="nearby-list">
                {result.stores.map((store) => (
                  <li key={store.physicalStoreId} className="nearby-store">
                    <ChainLogo chainName={store.chainName} size="sm" />
                    <div className="nearby-store-text">
                      <strong>{store.name}</strong>
                      {store.address && <span className="muted">{store.address}</span>}
                      {store.openingHours && <span className="muted">Horário: {store.openingHours}</span>}
                    </div>
                    <div className="nearby-store-distance">
                      <strong>{kmFormat.format(store.roadKm)} km</strong>
                      <span className="muted">ida e volta {money.format(store.travelCost.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted nearby-attribution">Distâncias aproximadas pela estrada. Lojas: {result.attribution}.</p>
          </>
        )
      )}
    </div>
  );
}
