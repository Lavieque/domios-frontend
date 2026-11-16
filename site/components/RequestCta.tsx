import { Link } from "react-router-dom";
import { useSite } from "../context";
import { PHOTO } from "../photos";
import { ArrowIcon } from "./Icons";

/** The close of every page: the pantry photograph, with the invitation set on its bare wall. */
export function RequestCta({ title, text }: { title: string; text: string }) {
  const { t, to } = useSite();
  return (
    <section className="close" aria-labelledby="close-title">
      <img className="close-photo" src={PHOTO.pantry} alt="" loading="lazy" decoding="async" />
      <div className="close-inner">
        <h2 id="close-title">{title}</h2>
        <p>{text}</p>
        <div className="close-actions">
          <Link className="button button-dark button-lg" to={to({ kind: "request" })}>
            {t.nav.request}
            <ArrowIcon />
          </Link>
          <Link className="text-link" to={to({ kind: "guide" })}>
            {t.home.guideCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
