import type { PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { RequestCta } from "../components/RequestCta";
import { ShelfDemo } from "../components/ShelfDemo";
import { Shot } from "../components/Shot";
import { Tour } from "../components/Tour";
import { DEMO_URL } from "../config";
import { useSite } from "../context";
import { PHOTO, SCENE } from "../photos";

export function HomePage() {
  const { lang, t, to } = useSite();
  const h = t.home;
  // The date is real (the household's timezone); what follows it in the strip is example data.
  const today = new Intl.DateTimeFormat(lang === "pt" ? "pt-PT" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Lisbon",
  }).format(new Date());

  // A warm light follows the mouse across the kitchen, like the window's light on the table.
  function light(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--lx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--ly", `${event.clientY - box.top}px`);
    event.currentTarget.classList.add("is-lit");
  }
  function dark(event: PointerEvent<HTMLElement>) {
    event.currentTarget.classList.remove("is-lit");
  }

  return (
    <>
      <section className="hero" aria-labelledby="hero-title" onPointerMove={light} onPointerLeave={dark}>
        <img className="hero-photo" src={PHOTO.kitchen} alt="" fetchPriority="high" decoding="async" />
        <span className="hero-light" aria-hidden="true" />
        <div className="hero-inner">
          <h1 id="hero-title">
            <span>{h.title[0]}</span> <span className="hero-accent">{h.title[1]}</span>
          </h1>
          <p className="hero-lede">{h.lede}</p>
          <div className="hero-actions">
            <Link className="button button-lg" to={to({ kind: "request" })}>
              {h.primary}
              <ArrowIcon />
            </Link>
            <a className="button button-ghost button-lg" href={DEMO_URL}>
              {t.nav.tryDemo}
              <ArrowIcon />
            </a>
            <a className="text-link hero-more" href="#como-funciona">
              {h.secondary}
              <ArrowIcon down />
            </a>
          </div>
        </div>

        <aside className="glance" aria-label={h.glance.label}>
          <p className="glance-day">
            <span>{today}</span>
            <span className="tag">{h.glance.example}</span>
          </p>
          <dl>
            {h.glance.items.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>
                  <strong>{item.value}</strong>
                  <span>{item.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section id="como-funciona" className="story" aria-labelledby="story-title">
        <header className="section-head">
          <h2 id="story-title">{h.storyTitle}</h2>
          <p>{h.storyIntro}</p>
        </header>
        {h.story.map((s) => {
          const f = t.features[s.key];
          // The shopping list is a phone screen: it is shown as one, in front of its scene.
          const phone = s.key === "lists";
          return (
            <article key={s.key} className={phone ? "story-row story-row-phone" : "story-row"}>
              <div className="story-copy">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <ul className="points">
                  {s.points.map((point) => (
                    <li key={point}>
                      <CheckIcon />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link className="text-link" to={to({ kind: "feature", key: s.key })}>
                  {f.name}: {f.hint.toLowerCase()}
                  <ArrowIcon />
                </Link>
              </div>
              {phone ? (
                <div className="story-scene">
                  <img className="story-scene-photo" src={SCENE[s.key]} alt="" loading="lazy" decoding="async" />
                  <Shot shot={s.key} alt={f.shotAlt} caption={h.tourCaption} phone />
                </div>
              ) : (
                <Shot shot={s.key} alt={f.shotAlt} caption={h.tourCaption} />
              )}
            </article>
          );
        })}
      </section>

      <Tour />

      <section className="judge" aria-labelledby="judge-title">
        <div className="judge-copy">
          <h2 id="judge-title">{h.judgeTitle}</h2>
          <p className="judge-intro">{h.judgeIntro}</p>
          <dl className="judge-list">
            {h.judge.map((item) => (
              <div key={item.title}>
                <dt>{item.title}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ShelfDemo />
      </section>

      <RequestCta title={h.closeTitle} text={h.closeText} />
    </>
  );
}
