import { useT } from "../i18n";

/**
 * Cartões vazios no sítio dos resultados (produtos, promoções, receitas) enquanto a
 * primeira página chega: a fotografia em cima e três linhas de texto, para a grelha
 * não aparecer do nada. Os leitores de ecrã ouvem só "A carregar…".
 */
export function CardsSkeleton({ count = 6 }: { count?: number }) {
  const t = useT();
  return (
    <div className="cards-skeleton" role="status">
      <span className="visually-hidden">{t.common.loading}</span>
      {Array.from({ length: count }, (_, n) => (
        <div key={n} className="skeleton-card" aria-hidden="true" style={{ animationDelay: `${n * 90}ms` }}>
          <span className="skeleton-card-media" />
          <span className="skeleton-bar skeleton-short" />
          <span className="skeleton-bar" />
          <span className="skeleton-bar skeleton-shorter" />
        </div>
      ))}
    </div>
  );
}
