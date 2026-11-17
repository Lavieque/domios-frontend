import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";
import { DemoTour } from "./DemoTour";
import { resetDemo } from "./install";
import { TOUR_EVENT, readTour, setTourStatus } from "./tour";
import "./demo.css";

const text = {
  pt: {
    label: "Demo",
    signedIn: "Dados de exemplo, guardados só neste browser.",
    touring: "A tua casa de experiência, guardada só neste browser.",
    guest: "Entra com qualquer email e palavra-passe.",
    reset: "Repor demo",
    tour: "Tour guiado",
    confirm: "Apagar o que mudaste e voltar aos dados de exemplo?",
  },
  en: {
    label: "Demo",
    signedIn: "Sample data, kept only in this browser.",
    touring: "Your trial home, kept only in this browser.",
    guest: "Sign in with any email and password.",
    reset: "Reset demo",
    tour: "Guided tour",
    confirm: "Discard your changes and go back to the sample data?",
  },
};

/** Strip on every page of the demo build: says it is a demo and resets it. */
export function DemoBanner({ signedIn }: { signedIn: boolean }) {
  const t = text[useLanguage()];
  const [busy, setBusy] = useState(false);
  const [tourStatus, setStatus] = useState(() => readTour().status);
  const tourOff = tourStatus === "off";

  useEffect(() => {
    const sync = () => setStatus(readTour().status);
    window.addEventListener(TOUR_EVENT, sync);
    return () => window.removeEventListener(TOUR_EVENT, sync);
  }, []);

  function reset() {
    if (!window.confirm(t.confirm)) return;
    setBusy(true);
    resetDemo();
  }

  return (
    <div className="demo-banner" role="note">
      <span className="demo-banner-tag">{t.label}</span>
      <span className="demo-banner-text">{!signedIn ? t.guest : tourStatus === "active" ? t.touring : t.signedIn}</span>
      {signedIn && tourOff && (
        <button type="button" className="demo-banner-reset" onClick={() => setTourStatus("welcome")}>
          {t.tour}
        </button>
      )}
      <button type="button" className="demo-banner-reset" onClick={reset} disabled={busy}>
        {t.reset}
      </button>
      {signedIn && <DemoTour />}
    </div>
  );
}
