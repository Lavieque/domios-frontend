import { Link } from "react-router-dom";

/** O destaque editorial: fotografia à esquerda, a receita à direita num cartão de vidro. */
export function FeatureCard({
  eyebrow,
  title,
  meta,
  imageUrl,
  to,
  action = "Ver receita →",
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  imageUrl: string | null;
  to: string;
  action?: string;
}) {
  return (
    <section className="feature-card">
      <div className="feature-card-media">{imageUrl && <img src={imageUrl} alt="" />}</div>
      <div className="feature-card-body">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {meta && <p className="feature-card-meta">{meta}</p>}
        <Link to={to} className="button-primary">
          {action}
        </Link>
      </div>
    </section>
  );
}
