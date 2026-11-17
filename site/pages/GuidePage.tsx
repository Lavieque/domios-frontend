import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CheckIcon } from "../components/Icons";
import { PageHead } from "../components/PageHead";
import { RequestCta } from "../components/RequestCta";
import { Shot } from "../components/Shot";
import { useSite } from "../context";
import { PHOTO } from "../photos";

export function GuidePage() {
  const { t } = useSite();
  const g = t.guide;
  return (
    <>
      <PageHead title={g.title} lede={g.lede} photo={PHOTO.guide} />

      <div className="page-body guide-layout">
        <GuideToc
          label={g.onThisPage}
          items={[...t.guideSteps.map((step, i) => ({ id: step.id, num: String(i + 1), title: step.title })), { id: "faq", num: "?", title: g.faqTitle }]}
        />

        <div className="guide-body">
          {t.guideSteps.map((step, i) => (
            <section key={step.id} id={step.id} className="guide-step" aria-labelledby={`${step.id}-title`}>
              <span className="step-number" aria-hidden="true">
                {i + 1}
              </span>
              <div className="guide-step-body">
                <h2 id={`${step.id}-title`}>{step.title}</h2>
                <p className="measure">{step.intro}</p>
                <ol className="step-list">
                  {step.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {step.tip && <p className="notice">{step.tip}</p>}
                {step.shot && <Shot shot={step.shot} alt={t.features[step.shot].shotAlt} caption={g.shotCaption} />}
              </div>
            </section>
          ))}

          <section id="faq" className="guide-faq" aria-labelledby="faq-title">
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

type TocItem = { id: string; num: string; title: string };

/**
 * "On this page", following the reader. The section being read is the one whose top has passed
 * a line a third of the way down the screen. A green marker slides to it, the rail beside the
 * list fills as far as the reader has got (including how far into the current section), and
 * the sections already read are ticked off. On a phone the list becomes a bar held under the
 * header: one circle per section, the current one opened out to show its title.
 */
function GuideToc({ label, items }: { label: string; items: TocItem[] }) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const links = useRef<(HTMLLIElement | null)[]>([]);

  // Os ids dizem que secções há; o array `items` é novo a cada render e não serve de dependência.
  const ids = items.map((item) => item.id).join("|");

  useEffect(() => {
    const sectionIds = ids.split("|");
    let frame = 0;
    function update() {
      frame = 0;
      const line = window.innerHeight * 0.34;
      const sections = sectionIds.map((id) => document.getElementById(id));
      let index = 0;
      sections.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) index = i;
      });
      // At the very bottom the last section may never reach the line: it is still the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) index = sectionIds.length - 1;
      const box = sections[index]?.getBoundingClientRect();
      const within = box ? Math.min(1, Math.max(0, (line - box.top) / box.height)) : 0;
      setActive(index);
      const ol = list.current;
      const li = links.current[index];
      if (ol && li) {
        ol.style.setProperty("--mark-y", `${li.offsetTop}px`);
        ol.style.setProperty("--mark-h", `${li.offsetHeight}px`);
        ol.style.setProperty("--fill", `${li.offsetTop + within * li.offsetHeight}px`);
        ol.style.setProperty("--fill-x", ((index + within) / sectionIds.length).toFixed(4));
      }
    }
    function request() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, [ids]);

  return (
    <nav className="guide-toc" aria-label={label}>
      <p className="guide-toc-title">{label}</p>
      <ol ref={list} style={{ "--count": items.length } as CSSProperties}>
        {items.map((item, i) => (
          <li
            key={item.id}
            ref={(el) => {
              links.current[i] = el;
            }}
            className={i < active ? "is-done" : i === active ? "is-current" : undefined}
          >
            <a href={`#${item.id}`} aria-current={i === active ? "location" : undefined}>
              <span className="toc-num" aria-hidden="true">
                <span>{item.num}</span>
                <CheckIcon />
              </span>
              <span className="toc-label">{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
