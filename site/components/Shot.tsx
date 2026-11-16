import { useState, type PointerEvent } from "react";
import { useSite } from "../context";
import { HOTSPOTS } from "../hotspots";
import type { FeatureKey } from "../i18n";

/**
 * Real capture of the app with example data. Every page has a desktop capture
 * (/shots/<page>.webp) and a phone one (/shots/<page>-phone.webp): small screens get the
 * phone capture, so the interface stays legible. `phone` forces the phone capture everywhere.
 * If a capture is missing the figure is simply absent: a broken image would be worse than none.
 *
 * Under the mouse the capture turns a little and catches the light. Some captures carry
 * numbered notes on their desktop version: they appear on hover, and each opens with the
 * mouse or the keyboard.
 */
export function Shot({
  shot,
  alt,
  caption,
  phone = false,
  eager = false,
}: {
  shot: FeatureKey;
  alt: string;
  caption?: string;
  phone?: boolean;
  eager?: boolean;
}) {
  const { t } = useSite();
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  const spots = phone ? [] : (HOTSPOTS[shot] ?? []);
  const notes = t.shotNotes.notes[shot] ?? [];

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--px", ((event.clientX - box.left) / box.width).toFixed(3));
    event.currentTarget.style.setProperty("--py", ((event.clientY - box.top) / box.height).toFixed(3));
    event.currentTarget.classList.add("is-lit");
  }
  function leave(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.classList.remove("is-lit");
  }

  return (
    <figure className={phone ? "shot shot-phone" : "shot"}>
      <div className="shot-frame" onPointerMove={move} onPointerLeave={leave}>
        <picture>
          {!phone && <source media="(max-width: 700px)" srcSet={`/shots/${shot}-phone.webp`} width={390} height={844} />}
          <img
            src={`/shots/${shot}${phone ? "-phone" : ""}.webp`}
            alt={alt}
            width={phone ? 390 : 1440}
            height={phone ? 844 : 900}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onError={() => setMissing(true)}
          />
        </picture>
        <span className="shot-glare" aria-hidden="true" />
        {spots.map(([x, y], i) =>
          notes[i] ? (
            <button
              key={i}
              type="button"
              className="hotspot"
              style={{ left: `${x}%`, top: `${y}%`, ["--i" as string]: i }}
              aria-label={`${t.shotNotes.label} ${i + 1}: ${notes[i]}`}
            >
              <span aria-hidden="true">{i + 1}</span>
              <span className={x > 60 ? "hotspot-note hotspot-note-left" : "hotspot-note"} aria-hidden="true">
                {notes[i]}
              </span>
            </button>
          ) : null,
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
