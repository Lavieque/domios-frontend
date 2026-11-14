import { useT } from "../i18n";
/**
 * Esqueleto de uma página inteira enquanto os dados chegam: o cabeçalho e dois
 * painéis no sítio onde vão aparecer, para a página não "saltar" quando chega a
 * resposta. Os leitores de ecrã ouvem só o `label`.
 */
export function PageSkeleton({ label }: { label?: string }) {
  const t = useT();
  return (
    <div className="page-skeleton" role="status" aria-live="polite">
      <span className="visually-hidden">{label ?? t.common.loading}</span>
      <header className="page-head" aria-hidden="true">
        <div className="page-skeleton-head">
          <span className="skeleton-bar skeleton-eyebrow" />
          <span className="skeleton-bar skeleton-title" />
        </div>
      </header>
      {[0, 1].map((n) => (
        <section key={n} className="panel" aria-hidden="true">
          <span className="skeleton-bar skeleton-heading" />
          <span className="skeleton-bar" />
          <span className="skeleton-bar skeleton-short" />
          <span className="skeleton-bar skeleton-shorter" />
        </section>
      ))}
    </div>
  );
}
