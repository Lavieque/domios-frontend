import { FeatureList } from "../components/FeatureList";
import { RequestCta } from "../components/RequestCta";
import { useSite } from "../context";

export function FeaturesPage() {
  const { t } = useSite();
  const p = t.featuresPage;
  return (
    <>
      <header className="page-head">
        <h1>{p.title}</h1>
        <p className="lede">{p.lede}</p>
      </header>
      <FeatureList groupHome={p.groupHome} groupCatalog={p.groupCatalog} />
      <RequestCta title={t.home.closeTitle} text={t.home.closeText} />
    </>
  );
}
