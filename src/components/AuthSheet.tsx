import type { ReactNode } from "react";
import { useT } from "../i18n";

/** As páginas sem sessão: um cartão de vidro sobre a fotografia, com o mesmo cabeçalho editorial das restantes. */

export function AuthSheet({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <div className="page auth-page">
      <section className="auth-sheet">
        <div className="auth-sheet-body">
          <p className="eyebrow">{t.common.tagline}</p>
          <h1>{title}</h1>
          {children}
        </div>
      </section>
    </div>
  );
}
