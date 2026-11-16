import { Link } from "react-router-dom";
import { FeatureRows } from "../components/FeatureList";
import { ArrowIcon } from "../components/Icons";
import { PageHead } from "../components/PageHead";
import { RequestCta } from "../components/RequestCta";
import { Shot } from "../components/Shot";
import { useSite } from "../context";
import type { FeatureKey } from "../i18n";
import { SCENE } from "../photos";

export function FeaturePage({ featureKey }: { featureKey: FeatureKey }) {
  const { t, to } = useSite();
  const f = t.features[featureKey];
  const p = t.feature;
  return (
    <>
      <PageHead title={f.title} lede={f.lede} photo={SCENE[featureKey]}>
        <nav className="crumbs" aria-label={t.nav.breadcrumb}>
          <Link to={to({ kind: "features" })}>{p.back}</Link>
        </nav>
      </PageHead>

      <div className="page-body">
        <div className="feature-layout">
          <div className="feature-text">
            <h2>{p.whatYouDo}</h2>
            <dl className="does-list">
              {f.does.map((item) => (
                <div key={item.title}>
                  <dt>{item.title}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
            </dl>

            <h2>{p.connectsTitle}</h2>
            <p className="measure">{f.connects}</p>

            <Link className="text-link" to={to({ kind: "guide" })}>
              {p.guideLink}
              <ArrowIcon />
            </Link>
          </div>
          <Shot shot={featureKey} alt={f.shotAlt} caption={p.shotCaption} eager />
        </div>

        <section className="feature-group" aria-labelledby="next-title">
          <h2 id="next-title">{p.nextTitle}</h2>
          <FeatureRows keys={f.next} />
        </section>
      </div>

      <RequestCta title={t.home.closeTitle} text={t.home.closeText} />
    </>
  );
}
