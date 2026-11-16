import { useState } from "react";
import { useLanguage } from "../i18n";
import { resetDemo } from "./install";
import "./demo.css";

const text = {
  pt: {
    label: "Demo",
    signedIn: "Dados de exemplo, guardados só neste browser.",
    guest: "Entra com qualquer email e palavra-passe.",
    reset: "Repor demo",
    confirm: "Apagar o que mudaste e voltar aos dados de exemplo?",
  },
  en: {
    label: "Demo",
    signedIn: "Sample data, kept only in this browser.",
    guest: "Sign in with any email and password.",
    reset: "Reset demo",
    confirm: "Discard your changes and go back to the sample data?",
  },
};

/** Strip on every page of the demo build: says it is a demo and resets it. */
export function DemoBanner({ signedIn }: { signedIn: boolean }) {
  const t = text[useLanguage()];
  const [busy, setBusy] = useState(false);

  function reset() {
    if (!window.confirm(t.confirm)) return;
    setBusy(true);
    resetDemo();
  }

  return (
    <div className="demo-banner" role="note">
      <span className="demo-banner-tag">{t.label}</span>
      <span className="demo-banner-text">{signedIn ? t.signedIn : t.guest}</span>
      <button type="button" className="demo-banner-reset" onClick={reset} disabled={busy}>
        {t.reset}
      </button>
    </div>
  );
}
