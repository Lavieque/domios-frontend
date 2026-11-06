import { Link } from "react-router-dom";
import { useSite } from "../context";

export function NotFoundPage() {
  const { t, to } = useSite();
  return (
    <header className="page-head">
      <h1>{t.notFound.title}</h1>
      <p className="lede">{t.notFound.text}</p>
      <p>
        <Link className="button-secondary" to={to({ kind: "home" })}>
          {t.notFound.home}
        </Link>
      </p>
    </header>
  );
}
