import type { ReactNode } from "react";

/** As páginas sem sessão: um cartão de vidro sobre a fotografia, com o mesmo cabeçalho editorial das restantes. */
export function AuthSheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="page auth-page">
      <section className="auth-sheet">
        <div className="auth-sheet-body">
          <p className="eyebrow">A casa, em harmonia</p>
          <h1>{title}</h1>
          {children}
        </div>
      </section>
    </div>
  );
}
