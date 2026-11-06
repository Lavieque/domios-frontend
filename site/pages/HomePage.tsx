import { Link } from "react-router-dom";
import { RequestCta } from "../components/RequestCta";
import { FeatureList } from "../components/FeatureList";
import { ShelfDemo } from "../components/ShelfDemo";
import { useSite } from "../context";

export function HomePage() {
  const { t, to } = useSite();
  const h = t.home;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">{h.title}</h1>
          <p className="lede">{h.lede}</p>
          <div className="hero-actions">
            <Link className="button-primary button-lg" to={to({ kind: "request" })}>
              {h.primary}
            </Link>
            <a className="text-link" href="#como-funciona">
              {h.secondary}
            </a>
          </div>
        </div>
        <ShelfDemo />
      </section>

      <section id="como-funciona" className="band" aria-labelledby="judge-title">
        <h2 id="judge-title">{h.judgeTitle}</h2>
        <p className="band-intro">{h.judgeIntro}</p>
        <ol className="judge-list">
          {h.judge.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band" aria-labelledby="menus-title">
        <h2 id="menus-title">{h.connectedTitle}</h2>
        <p className="band-intro">{h.connectedIntro}</p>
        <FeatureList groupHome={h.groupHome} groupCatalog={h.groupCatalog} />
      </section>

      <section className="band" aria-labelledby="flow-title">
        <h2 id="flow-title">{h.flowTitle}</h2>
        <ol className="flow">
          {h.flow.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="guide-teaser" aria-labelledby="guide-teaser-title">
        <div>
          <h2 id="guide-teaser-title">{h.guideTitle}</h2>
          <p>{h.guideText}</p>
        </div>
        <Link className="button-secondary" to={to({ kind: "guide" })}>
          {h.guideCta}
        </Link>
      </section>

      <RequestCta title={h.closeTitle} text={h.closeText} />
    </>
  );
}
