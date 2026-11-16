import { useSite } from "../context";

/**
 * The example product as an object: a gable-top milk carton built from CSS faces in 3D,
 * standing out of the price card. The brand, "Serra Clara", is invented: a real brand next
 * to example prices and verdicts would read as a claim about it. Decorative: the card already
 * says what the product is. `verdict` replays a small hop each time the verdict changes.
 */
export function Carton({ verdict }: { verdict: string }) {
  const { t } = useSite();
  const [name, kind] = t.home.exampleCarton;
  return (
    <div className="carton-stage" aria-hidden="true">
      <div className="carton-glow" />
      <div className="carton-hop" key={verdict}>
        <div className="carton">
          <div className="carton-face carton-front">
            <span className="carton-brand">
              <svg viewBox="0 0 24 14" width="24" height="14">
                <circle cx="17" cy="5" r="3.2" />
                <path d="M0 14 L7 5 L11 9 L14 6 L24 14 Z" />
              </svg>
              Serra Clara
            </span>
            <span className="carton-name">{name}</span>
            <span className="carton-kind">{kind}</span>
            <span className="carton-wave" />
            <span className="carton-size">1 L</span>
          </div>
          <div className="carton-face carton-back" />
          <div className="carton-face carton-right">
            <span className="carton-lines" />
          </div>
          <div className="carton-face carton-left" />
          <div className="carton-face carton-roof carton-roof-front" />
          <div className="carton-face carton-roof carton-roof-back" />
          <div className="carton-face carton-fin" />
        </div>
      </div>
    </div>
  );
}
