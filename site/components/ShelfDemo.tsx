import { useState } from "react";
import { useSite } from "../context";

/**
 * The home's first-viewport demonstration: one shelf label that judges its own price.
 * Everything here is an example and says so; the four states mirror the app's verdicts.
 */
const MIN = 0.79;
const AVG = 0.92;
const MAX = 1.09;

const STATES = [
  { key: "historicLow", tone: 1, price: 0.79 },
  { key: "belowAverage", tone: 2, price: 0.86 },
  { key: "usual", tone: 3, price: 0.92 },
  { key: "aboveAverage", tone: 4, price: 1.05 },
] as const;

export function ShelfDemo() {
  const { lang, t } = useSite();
  const [index, setIndex] = useState(0);
  const state = STATES[index];
  const fmt = new Intl.NumberFormat(lang === "pt" ? "pt-PT" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const at = (value: number) => `${((value - MIN) / (MAX - MIN)) * 100}%`;
  const verdict = t.verdict[state.key];

  return (
    <div className="demo">
      <article className="shelf-label demo-label" aria-labelledby="demo-name">
        <div className="label-body">
          <div className="demo-head">
            <span className="pill-muted">{t.home.exampleTag}</span>
          </div>
          <h2 id="demo-name" className="demo-name">
            {t.home.exampleName}
          </h2>
          <p className="demo-unit">{t.home.exampleUnit}</p>

          <div className="label-price price-hero" aria-label={`${fmt.format(state.price)} €`}>
            {fmt.format(state.price)}
            <small>€</small>
          </div>

          <div className="price-range" aria-hidden="true">
            <div className="price-range-track">
              <span className="price-range-avg" style={{ left: at(AVG) }} />
              <span className="price-range-now" style={{ left: at(state.price) }} />
            </div>
            <div className="price-range-legend">
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
        </div>
        <div className={`verdict verdict-${state.tone}`} aria-live="polite">
          {verdict}
        </div>
      </article>

      <div className="demo-picker" role="group" aria-label={t.home.pickVerdict}>
        <p className="demo-picker-label">{t.home.pickVerdict}</p>
        <div className="chips">
          {STATES.map((s, i) => (
            <button key={s.key} type="button" className="chip" aria-pressed={i === index} onClick={() => setIndex(i)}>
              <span className={`chip-dot chip-dot-${s.tone}`} aria-hidden="true" />
              {t.verdict[s.key]}
            </button>
          ))}
        </div>
      </div>
      <p className="demo-note">{t.home.exampleNote}</p>
    </div>
  );
}
