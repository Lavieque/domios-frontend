import { FeatureList } from "../components/FeatureList";
import { PageHead } from "../components/PageHead";
import { RequestCta } from "../components/RequestCta";
import { useSite } from "../context";
import { PHOTO } from "../photos";

export function FeaturesPage() {
  const { t } = useSite();
  const p = t.featuresPage;
  return (
    <>
      <PageHead title={p.title} lede={p.lede} photo={PHOTO.kitchen} />
      <div className="page-body">
        <FeatureList />
      </div>
      <RequestCta title={t.home.closeTitle} text={t.home.closeText} />
    </>
  );
}
