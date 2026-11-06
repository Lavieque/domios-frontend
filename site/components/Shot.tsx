import { useState } from "react";
import type { FeatureKey } from "../i18n";

/**
 * Real capture of the app, served from /shots/<menu>.png (made with `npm run shots`, see
 * site/scripts/capture-shots.mjs). Until a capture exists the figure is simply absent:
 * a broken image would be worse than none. The shopping list is a phone capture.
 */
export function Shot({ shot, alt, caption }: { shot: FeatureKey; alt: string; caption: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  const phone = shot === "lists";
  return (
    <figure className={phone ? "shot shot-phone" : "shot"}>
      <img
        src={`/shots/${shot}.png`}
        alt={alt}
        width={phone ? 390 : 1280}
        height={phone ? 844 : 800}
        loading="lazy"
        decoding="async"
        onError={() => setMissing(true)}
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
