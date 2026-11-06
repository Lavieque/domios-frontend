import { Link } from "react-router-dom";
import { useSite } from "../context";
import { FEATURE_KEYS, type FeatureKey } from "../i18n";

/** The home group (first four) and the catalog group, as one bordered list of rows each. */
const HOME: FeatureKey[] = ["today", "plan", "pantry", "lists"];
const CATALOG: FeatureKey[] = ["products", "promotions", "recipes", "household"];

export function FeatureList({ groupHome, groupCatalog }: { groupHome: string; groupCatalog: string }) {
  return (
    <div className="feature-groups">
      <FeatureGroup title={groupHome} keys={HOME} />
      <FeatureGroup title={groupCatalog} keys={CATALOG} />
    </div>
  );
}

function FeatureGroup({ title, keys }: { title: string; keys: FeatureKey[] }) {
  const { t, to } = useSite();
  // Keep the app's own menu order inside each group.
  const ordered = FEATURE_KEYS.filter((k) => keys.includes(k));
  return (
    <section className="feature-group">
      <h3>{title}</h3>
      <ul className="menu-labels">
        {ordered.map((key) => {
          const f = t.features[key];
          return (
            <li key={key}>
              {/* Each menu is a shelf label: the name on the body, one line of fact on the foot. */}
              <Link to={to({ kind: "feature", key })} className="shelf-label menu-label">
                <span className="menu-label-name">{f.name}</span>
                <span className="menu-label-foot">
                  <span className="menu-label-hint">{f.hint}</span>
                  <svg className="row-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
