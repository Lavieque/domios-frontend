import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../context";
import { FEATURE_KEYS } from "../i18n";
import { ArrowIcon } from "./Icons";
import { Shot } from "./Shot";

/**
 * "Inside DomiOS": the app's own menu as tabs, with the real capture of each page.
 * Arrow keys move between tabs, as in any tab list; on a touch screen the capture can be
 * swiped sideways to the next or previous page.
 *
 * While the tour is on screen and nobody has touched it, it turns its own pages: a bar fills
 * under the selected tab and the next page opens when it is full. The first tap, key or swipe
 * hands it over for good. The bar is a CSS animation, so it does not run (and the tour does
 * not turn) when the visitor asks for less motion.
 */
export function Tour() {
  const { t, to } = useSite();
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const [back, setBack] = useState(false);
  const section = useRef<HTMLElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const key = FEATURE_KEYS[index];
  const feature = t.features[key];
  const last = FEATURE_KEYS.length - 1;

  useEffect(() => {
    const el = section.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // On a phone the tabs are a horizontal row: keep the selected one in view, without moving the page.
  useEffect(() => {
    const row = list.current;
    const tab = tabs.current[index];
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: tab.offsetLeft - row.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
  }, [index]);

  function go(next: number, byHand: boolean) {
    setBack(next < index && !(index === last && next === 0));
    setIndex(next);
    if (byHand) setAuto(false);
  }

  function onKeyDown(event: KeyboardEvent) {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    go(next, true);
    tabs.current[next]?.focus();
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? (index === last ? 0 : index + 1) : index === 0 ? last : index - 1, true);
  }

  const playing = auto && seen;

  return (
    <section ref={section} className="tour" aria-labelledby="tour-title">
      <div className="tour-inner">
        <header className="section-head">
          <h2 id="tour-title">{t.home.tourTitle}</h2>
          <p>{t.home.tourIntro}</p>
        </header>
        <div className="tour-layout">
          <div
            ref={list}
            className="tour-tabs"
            role="tablist"
            aria-label={t.home.tourTabs}
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
          >
            {FEATURE_KEYS.map((k, i) => (
              <button
                key={k}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tour-tab-${k}`}
                aria-selected={i === index}
                aria-controls="tour-panel"
                tabIndex={i === index ? 0 : -1}
                onClick={() => go(i, true)}
              >
                {t.features[k].name}
                {i === index && auto && (
                  <span
                    className={playing ? "tour-tab-timer is-playing" : "tour-tab-timer"}
                    aria-hidden="true"
                    onAnimationEnd={() => go(index === last ? 0 : index + 1, false)}
                  />
                )}
              </button>
            ))}
          </div>
          <div
            className={back ? "tour-panel is-back" : "tour-panel"}
            role="tabpanel"
            id="tour-panel"
            aria-labelledby={`tour-tab-${key}`}
            key={key}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipe.current = null)}
          >
            <Shot shot={key} alt={feature.shotAlt} caption={t.home.tourCaption} />
            <div className="tour-copy">
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.lede}</p>
              </div>
              <Link className="text-link" to={to({ kind: "feature", key })}>
                {t.home.tourOpen}
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
