import { RequestCta } from "../components/RequestCta";
import { Shot } from "../components/Shot";
import { useSite } from "../context";

export function GuidePage() {
  const { t } = useSite();
  const g = t.guide;
  return (
    <>
      <header className="page-head">
        <h1>{g.title}</h1>
        <p className="lede">{g.lede}</p>
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label={g.onThisPage}>
          <p className="guide-toc-title">{g.onThisPage}</p>
          <ol>
            {t.guideSteps.map((step) => (
              <li key={step.id}>
                <a href={`#${step.id}`}>{step.title}</a>
              </li>
            ))}
            <li>
              <a href="#faq">{g.faqTitle}</a>
            </li>
          </ol>
        </nav>

        <div className="guide-body">
          {t.guideSteps.map((step, i) => (
            <section key={step.id} id={step.id} className="guide-step" aria-labelledby={`${step.id}-title`}>
              <h2 id={`${step.id}-title`}>
                <span className="step-number" aria-hidden="true">
                  {i + 1}
                </span>
                {step.title}
              </h2>
              <p className="measure">{step.intro}</p>
              <ol className="step-list">
                {step.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {step.tip && <p className="notice">{step.tip}</p>}
              {step.shot && <Shot shot={step.shot} alt={t.features[step.shot].shotAlt} caption={g.shotCaption} />}
            </section>
          ))}

          <section id="faq" className="guide-step" aria-labelledby="faq-title">
            <h2 id="faq-title">{g.faqTitle}</h2>
            <div className="faq">
              {g.faq.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>

      <RequestCta title={t.home.closeTitle} text={t.home.closeText} />
    </>
  );
}
