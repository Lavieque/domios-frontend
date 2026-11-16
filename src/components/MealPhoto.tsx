import { useState } from "react";

/**
 * A foto do prato no cartão de uma refeição, para o reconhecer de relance. Sem foto
 * (ainda por saber, inexistente ou que não carrega) fica um prato desenhado no mesmo
 * lugar: os cartões alinham sempre.
 */
export function MealPhoto({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = typeof src === "string" && !failed;
  return (
    <span className="week-meal-photo" data-state={show && loaded ? "loaded" : undefined} aria-hidden="true">
      <svg className="week-meal-photo-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="4" />
        <path d="M2.5 4v5a1.5 1.5 0 0 0 3 0V4 M4 9v11 M21.5 4c-1.5 1-2 3-2 6h2v10" />
      </svg>
      {show && <img src={src} alt="" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    </span>
  );
}
