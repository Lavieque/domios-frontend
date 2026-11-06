import { Link } from "react-router-dom";
import { useSite } from "../context";

export function RequestCta({ title, text }: { title: string; text: string }) {
  const { t, to } = useSite();
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <div>
        <h2 id="cta-title">{title}</h2>
        <p>{text}</p>
      </div>
      <Link className="button-primary" to={to({ kind: "request" })}>
        {t.nav.request}
      </Link>
    </section>
  );
}
