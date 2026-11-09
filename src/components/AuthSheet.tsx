import type { ReactNode } from "react";

const weekday = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  weekday: "long",
});
const month = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  month: "long",
});
const dayOfMonth = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  day: "numeric",
});

/**
 * As páginas sem sessão como a folha de hoje: o número do dia na coluna fixa,
 * o formulário à direita de um filete. É a mesma folha que se vê depois de entrar.
 */
export function AuthSheet({ title, children }: { title: string; children: ReactNode }) {
  const now = new Date();
  return (
    <div className="page auth-page">
      <section className="auth-sheet">
        <div className="auth-sheet-day" aria-hidden="true">
          <span className="auth-sheet-weekday">{weekday.format(now)}</span>
          <span className="auth-sheet-number">{dayOfMonth.format(now)}</span>
          <span className="auth-sheet-month">{month.format(now)}</span>
        </div>
        <div className="auth-sheet-body">
          <h1>{title}</h1>
          {children}
        </div>
      </section>
    </div>
  );
}
