import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const groups = [
  {
    title: "Em casa",
    links: [
      { to: "/", label: "Hoje", end: true },
      { to: "/plano", label: "Plano" },
      { to: "/despensa", label: "Despensa" },
      { to: "/listas", label: "Listas" },
    ],
  },
  {
    title: "Catálogo",
    links: [
      { to: "/produtos", label: "Produtos" },
      { to: "/promocoes", label: "Promoções" },
      { to: "/receitas", label: "Receitas" },
      { to: "/ementas", label: "Ementas" },
    ],
  },
];

/**
 * Menu principal. No desktop fica em linha no cabeçalho; em ecrãs estreitos um botão abre-o
 * por baixo do cabeçalho, no fluxo da página: nada fica fixo no ecrã.
 */
export function AppMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Fecha ao mudar de página.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="app-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          {open ? (
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
        {open ? "Fechar" : "Menu"}
      </button>

      <nav id="app-menu" className="app-nav" data-open={open} aria-label="Principal">
        {groups.map((group) => (
          <div key={group.title} className="nav-group">
            <h2 className="nav-group-title">{group.title}</h2>
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
        {/* No desktop, Casa e Conta vivem à direita do cabeçalho; aqui só aparecem no painel. */}
        <div className="nav-group nav-group-account">
          <h2 className="nav-group-title">A tua conta</h2>
          <NavLink to="/casa">Casa</NavLink>
          <NavLink to="/conta" title={email}>
            Conta
          </NavLink>
        </div>
      </nav>
    </>
  );
}
