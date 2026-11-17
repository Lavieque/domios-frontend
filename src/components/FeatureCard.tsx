import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { tr } from "../i18n";

/** O destaque editorial: fotografia à esquerda, a receita à direita num cartão de vidro. */
export function FeatureCard({
  eyebrow,
  title,
  meta,
  imageUrl,
  to,
  action,
  badge,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  imageUrl: string | null;
  to: string;
  action?: string;
  /** Marca pequena no canto da fotografia (ex.: "já feita"). */
  badge?: ReactNode;
}) {
  return (
    <section className="feature-card">
      <div className="feature-card-media">
        {imageUrl && <img src={imageUrl} alt="" />}
        {badge !== undefined && <span className="recipe-row-badge">{badge}</span>}
      </div>
      <div className="feature-card-body">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {meta && <p className="feature-card-meta">{meta}</p>}
        <Link to={to} className="button-primary">
          {action ?? tr().ui.seeRecipe}
        </Link>
      </div>
    </section>
  );
}
