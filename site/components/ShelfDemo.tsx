import { useState, type PointerEvent } from "react";
import { useSite } from "../context";
import { Carton } from "./Carton";

/**
 * The price verdict, shown working: one example product whose price moves through the four
 * verdicts the app gives. Everything here is an example and says so.
 */
const MIN = 0.79;
const AVG = 0.92;
const MAX = 1.09;

const STATES = [
  { key: "historicLow", price: 0.79 },
  { key: "belowAverage", price: 0.86 },
  { key: "usual", price: 0.92 },
  { key: "aboveAverage", price: 1.05 },
] as const;

export function ShelfDemo() {
  const { lang, t } = useSite();
  const [index, setIndex] = useState(0);
  const state = STATES[index];
  const fmt = new Intl.NumberFormat(lang === "pt" ? "pt-PT" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const at = (value: number) => `${((value - MIN) / (MAX - MIN)) * 100}%`;

  // The carton turns a little towards the pointer (only with a mouse; CSS ignores it under reduced motion).
  function tilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tilt-x", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    event.currentTarget.style.setProperty("--tilt-y", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  }
  function untilt(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
  }

  return (
    <div className="demo">
      <article className="demo-card" data-verdict={state.key} aria-labelledby="demo-name" onPointerMove={tilt} onPointerLeave={untilt}>
        <Carton verdict={state.key} />
        <div className="demo-head">
          <span className="tag">{t.home.exampleTag}</span>
          <h3 id="demo-name">{t.home.exampleName}</h3>
          <p className="demo-unit">{t.home.exampleUnit}</p>
        </div>

        <p className="demo-price" aria-label={`${fmt.format(state.price)} €`}>
          <span className="demo-price-value" key={state.key}>
            {fmt.format(state.price)}
          </span>
          <small>€</small>
        </p>

        <div className="demo-verdict" aria-live="polite">
          <span className="verdict-scale" aria-hidden="true">
            {STATES.map((s, i) => (
              <span key={s.key} className={i === index ? "is-on" : undefined} />
            ))}
          </span>
          {t.verdict[state.key]}
        </div>

        <div className="demo-range" aria-hidden="true">
          <div className="demo-range-track">
            <span className="demo-range-avg" style={{ left: at(AVG) }} />
            <span className="demo-range-now" style={{ left: at(state.price) }} />
          </div>
          <div className="demo-range-legend">
            <span>
              {t.home.range.min} {fmt.format(MIN)} €
            </span>
            <span>
              {t.home.range.avg} {fmt.format(AVG)} €
            </span>
            <span>
              {t.home.range.max} {fmt.format(MAX)} €
            </span>
          </div>
        </div>

        <div className="demo-picker" role="group" aria-label={t.home.pickVerdict}>
          <p>{t.home.pickVerdict}</p>
          <div className="chips">
            {STATES.map((s, i) => (
              <button key={s.key} type="button" className="chip" aria-pressed={i === index} onClick={() => setIndex(i)}>
                {t.verdict[s.key]}
              </button>
            ))}
          </div>
        </div>
      </article>
      <p className="demo-note">{t.home.exampleNote}</p>
    </div>
  );
}
