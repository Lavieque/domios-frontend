import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { APP_LOGIN_URL } from "./config";
import { ArrowIcon, MenuIcon } from "./components/Icons";
import { makeContext, SiteProvider, useSite } from "./context";
import { dicts, LANGS, pathFor, parseRoute, switchLanguage, type Lang, type Route } from "./i18n";
import { FeaturePage } from "./pages/FeaturePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { GuidePage } from "./pages/GuidePage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RequestPage } from "./pages/RequestPage";
import { useScrollMotion } from "./motion";
import { useReveal } from "./reveal";

export function Site() {
  const { pathname } = useLocation();
  const { lang, route } = parseRoute(pathname);
  const t = dicts[lang];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  useReveal(pathname);
  useScrollMotion(pathname);

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.title = titleOf(route, t);
    setMeta("description", descriptionOf(route, t));
    setAlternates(route);
  }, [route, t]);

  return (
    <SiteProvider value={makeContext(lang, t)}>
      <a className="skip-link" href="#content">
        {t.nav.skip}
      </a>
      <Header pathname={pathname} />
      <main id="content" className="site-main">
        {renderRoute(route)}
      </main>
      <Footer />
    </SiteProvider>
  );
}

function renderRoute(route: Route) {
  switch (route.kind) {
    case "home":
      return <HomePage />;
    case "features":
      return <FeaturesPage />;
    case "feature":
      return <FeaturePage featureKey={route.key} />;
    case "guide":
      return <GuidePage />;
    case "request":
      return <RequestPage />;
    case "notFound":
      return <NotFoundPage />;
  }
}

function titleOf(route: Route, t: (typeof dicts)[Lang]): string {
  const name = t.siteName;
  switch (route.kind) {
    case "home":
      return `${name}: ${t.home.title.join(" ")}`;
    case "features":
      return `${t.featuresPage.title} · ${name}`;
    case "feature":
      return `${t.features[route.key].title} · ${name}`;
    case "guide":
      return `${t.guide.title} · ${name}`;
    case "request":
      return `${t.request.title} · ${name}`;
    case "notFound":
      return `${t.notFound.title} · ${name}`;
  }
}

function descriptionOf(route: Route, t: (typeof dicts)[Lang]): string {
  switch (route.kind) {
    case "feature":
      return t.features[route.key].lede;
    case "features":
      return t.featuresPage.lede;
    case "guide":
      return t.guide.lede;
    case "request":
      return t.request.lede;
    default:
      return t.home.lede;
  }
}

function setMeta(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** hreflang for every language, so search engines pair the pt and en versions of a page. */
function setAlternates(route: Route) {
  document.head.querySelectorAll("link[data-alt]").forEach((el) => el.remove());
  for (const lang of LANGS) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = dicts[lang].htmlLang;
    link.href = `${window.location.origin}${pathFor(lang, route)}`;
    link.dataset.alt = "1";
    document.head.appendChild(link);
  }
}

export function Brand() {
  const { to } = useSite();
  return (
    <Link to={to({ kind: "home" })} className="brand">
      <svg className="brand-mark" viewBox="0 0 120 120" aria-hidden="true">
        <polyline
          points="30,72 30,46 60,20 90,46 90,72"
          fill="none"
          stroke="#2a6a78"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="52,88 52,62 82,36 112,62 112,88"
          fill="none"
          stroke="#1e3a5c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="wordmark">
        Domi<em>OS</em>
      </span>
    </Link>
  );
}

function Header({ pathname }: { pathname: string }) {
  const { lang, t, to } = useSite();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  // The header starts clear over the photograph and takes a solid ground once the page moves.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const classes = ["site-header", stuck || open ? "is-solid" : "", open ? "is-open" : ""].filter(Boolean).join(" ");
  return (
    <header className={classes}>
      <div className="site-header-inner">
        <Brand />
        <div className="site-menu" id="site-menu">
          <nav className="site-nav" aria-label={t.nav.main}>
            <Link to={to({ kind: "features" })}>{t.nav.features}</Link>
            <Link to={to({ kind: "guide" })}>{t.nav.guide}</Link>
            <a href={APP_LOGIN_URL}>{t.nav.enter}</a>
          </nav>
          <nav className="lang-switch" aria-label={t.nav.language}>
            {LANGS.map((code) => (
              <Link
                key={code}
                to={switchLanguage(pathname, code)}
                hrefLang={dicts[code].htmlLang}
                lang={dicts[code].htmlLang}
                aria-current={code === lang ? "true" : undefined}
              >
                {code.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
        <Link className="button" to={to({ kind: "request" })}>
          {t.nav.request}
        </Link>
        <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
          <MenuIcon open={open} />
          <span className="sr-only">{open ? t.nav.menuClose : t.nav.menuOpen}</span>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  const { t, to } = useSite();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Brand />
          <p>{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.footer.product}>
          <h2>{t.footer.product}</h2>
          <Link to={to({ kind: "features" })}>{t.nav.features}</Link>
          <Link to={to({ kind: "guide" })}>{t.nav.guide}</Link>
        </nav>
        <nav aria-label={t.footer.help}>
          <h2>{t.footer.help}</h2>
          <Link to={to({ kind: "request" })}>{t.nav.request}</Link>
          <a href={APP_LOGIN_URL}>
            {t.nav.enter}
            <ArrowIcon />
          </a>
        </nav>
        <p className="footer-honest">{t.footer.honest}</p>
      </div>
    </footer>
  );
}
