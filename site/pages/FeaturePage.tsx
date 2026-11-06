import { Link } from "react-router-dom";
import { RequestCta } from "../components/RequestCta";
import { Shot } from "../components/Shot";
import { useSite } from "../context";
import type { FeatureKey } from "../i18n";

export function FeaturePage({ featureKey }: { featureKey: FeatureKey }) {
  const { t, to } = useSite();
  const f = t.features[featureKey];
  const p = t.feature;
  return (
    <>
      <nav className="crumbs" aria-label={t.nav.breadcrumb}>
        <Link to={to({ kind: "features" })}>{p.back}</Link>
      </nav>
      <header className="page-head">
        <h1>{f.title}</h1>
        <p className="lede">{f.lede}</p>
      </header>

      <div className="feature-layout">
        <div className="feature-text">
          <h2>{p.whatYouDo}</h2>
          <ul className="does-list">
            {f.does.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>

          <h2>{p.connectsTitle}</h2>
          <p className="measure">{f.connects}</p>

          <p>
            <Link className="text-link" to={to({ kind: "guide" })}>
              {p.guideLink}
            </Link>
          </p>
        </div>
        <Shot shot={featureKey} alt={f.shotAlt} caption={p.shotCaption} />
      </div>

      <section className="band" aria-labelledby="next-title">
        <h2 id="next-title">{p.nextTitle}</h2>
        <ul className="row-list next-list">
          {f.next.map((key) => (
            <li key={key}>
              <Link to={to({ kind: "feature", key })} className="row-link">
                <span className="row-name">{t.features[key].name}</span>
                <span className="row-hint">{t.features[key].hint}</span>
                <svg className="row-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <RequestCta title={t.home.closeTitle} text={t.home.closeText} />
    </>
  );
}
