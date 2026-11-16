import { Link } from "react-router-dom";
import { useSite } from "../context";
import { FEATURE_KEYS, type FeatureKey } from "../i18n";
import { ArrowIcon } from "./Icons";

/** The app's pages in three groups, in the app's own menu order. */
const HOME: FeatureKey[] = ["today", "plan", "pantry", "lists"];
const KITCHEN: FeatureKey[] = ["cook", "recipes", "templates", "nutrition"];
const CATALOG: FeatureKey[] = ["products", "promotions", "household"];

export function FeatureList() {
  const { t } = useSite();
  const p = t.featuresPage;
  return (
    <div className="feature-groups">
      <FeatureGroup title={p.groupHome} keys={HOME} />
      <FeatureGroup title={p.groupKitchen} keys={KITCHEN} />
      <FeatureGroup title={p.groupCatalog} keys={CATALOG} />
    </div>
  );
}

function FeatureGroup({ title, keys }: { title: string; keys: FeatureKey[] }) {
  const ordered = FEATURE_KEYS.filter((k) => keys.includes(k));
  return (
    <section className="feature-group">
      <h2>{title}</h2>
      <FeatureRows keys={ordered} />
    </section>
  );
}

/** One row per page: a small capture, the page's name and what it is for. */
export function FeatureRows({ keys }: { keys: readonly FeatureKey[] }) {
  const { t, to } = useSite();
  return (
    <ul className="feature-rows">
      {keys.map((key) => {
        const f = t.features[key];
        return (
          <li key={key}>
            <Link to={to({ kind: "feature", key })} className="feature-row">
              <img className="feature-row-thumb" src={`/shots/${key}-thumb.webp`} alt="" width={480} height={300} loading="lazy" decoding="async" />
              <span className="feature-row-text">
                <span className="feature-row-name">{f.name}</span>
                <span className="feature-row-hint">{f.hint}</span>
              </span>
              <ArrowIcon />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
