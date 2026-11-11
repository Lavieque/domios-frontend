import { useRef } from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) {
    return null;
  }

  // Mudar de página leva ao início da lista (o que vem logo antes da paginação),
  // em vez de deixar a pessoa no fundo da página nova.
  function go(next: number) {
    onPageChange(next);

    // O início da lista é o que está logo antes da paginação. Mede-se de novo sempre que a
    // página muda de tamanho: enquanto a página nova carrega a lista pode sair do ecrã, e o
    // que está por cima dela (um destaque só da primeira página) pode desaparecer.
    const targetTop = () => {
      const list = ref.current?.previousElementSibling ?? ref.current?.parentElement;
      return list ? Math.max(0, list.getBoundingClientRect().top + window.scrollY - 24) : 0;
    };
    const settle = () => {
      const top = targetTop();
      if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top });
    };
    settle();
    // Pára ao fim de uns segundos ou assim que a pessoa mexer na página.
    const observer = new ResizeObserver(settle);
    observer.observe(document.body);
    const stop = () => {
      observer.disconnect();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    window.setTimeout(stop, 4000);
  }

  return (
    <div className="pagination" ref={ref}>
      <button type="button" disabled={page <= 1} onClick={() => go(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {totalPages} ({total} resultados)
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Seguinte
      </button>
    </div>
  );
}
