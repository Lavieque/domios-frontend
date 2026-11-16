import { Link } from "react-router-dom";
import { ArrowIcon } from "../components/Icons";
import { PageHead } from "../components/PageHead";
import { useSite } from "../context";
import { PHOTO } from "../photos";

export function NotFoundPage() {
  const { t, to } = useSite();
  return (
    <div className="not-found">
      <PageHead title={t.notFound.title} lede={t.notFound.text} photo={PHOTO.kitchen} />
      <div className="page-body not-found-actions">
        <Link className="button button-dark" to={to({ kind: "home" })}>
          {t.notFound.home}
          <ArrowIcon />
        </Link>
        <Link className="text-link" to={to({ kind: "features" })}>
          {t.featuresPage.title}
        </Link>
        <Link className="text-link" to={to({ kind: "guide" })}>
          {t.guide.title}
        </Link>
      </div>
    </div>
  );
}
