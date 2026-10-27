import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface MenuLink {
  to: string;
  label: string;
  /** Uma linha na gaveta a dizer para que serve a página. */
  hint: string;
  end?: boolean;
}

const groups: { title: string; links: MenuLink[] }[] = [
  {
    title: "Em casa",
    links: [
      { to: "/", label: "Hoje", hint: "O dia de hoje", end: true },
      { to: "/plano", label: "Plano", hint: "Refeições da semana" },
      { to: "/despensa", label: "Despensa", hint: "O que há em casa" },
      { to: "/listas", label: "Listas", hint: "Compras por fazer" },
    ],
  },
  {
    title: "Catálogo",
    links: [
      { to: "/produtos", label: "Produtos", hint: "Preços nas lojas" },
      { to: "/promocoes", label: "Promoções", hint: "Descontos em vigor" },
      { to: "/receitas", label: "Receitas", hint: "Para cozinhar" },
      { to: "/ementas", label: "Ementas", hint: "Planos prontos" },
    ],
  },
];

const accountGroup: { title: string; links: MenuLink[] } = {
  title: "A tua conta",
  links: [
    { to: "/casa", label: "Casa", hint: "Membros da casa" },
    { to: "/conta", label: "Conta", hint: "Email e password" },
  ],
};

/**
 * Menu principal. No desktop fica em linha no cabeçalho; em ecrãs estreitos um botão abre-o
 * numa gaveta à direita, por cima da página. Nada fica fixo no ecrã enquanto a gaveta está fechada.
 */
export function AppMenu() {
  const drawer = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();

  // Fecha ao mudar de página.
  useEffect(() => drawer.current?.close(), [pathname]);

  function open() {
    drawer.current?.showModal();
  }

  function close() {
    drawer.current?.close();
  }

  return (
    <>
      <nav className="app-nav" aria-label="Principal">
        {groups.map((group) => (
          <div key={group.title} className="nav-group">
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button type="button" className="menu-toggle" aria-haspopup="dialog" onClick={open}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Menu
      </button>

      {/* Um clique no fundo cai no próprio dialog, fora do painel: fecha. */}
      <dialog
        ref={drawer}
        className="menu-drawer"
        aria-label="Menu"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="menu-drawer-panel">
          <div className="menu-drawer-head">
            <span className="menu-drawer-title">Menu</span>
            <button type="button" className="menu-close" onClick={close}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Fechar
            </button>
          </div>
          <nav aria-label="Principal">
            {[...groups, accountGroup].map((group) => (
              <section key={group.title} className="drawer-group">
                <h2 className="drawer-group-title">{group.title}</h2>
                {group.links.map((link) => (
                  <NavLink key={link.to} to={link.to} end={link.end} className="drawer-link">
                    <span className="drawer-link-label">{link.label}</span>
                    <span className="drawer-link-hint">{link.hint}</span>
                  </NavLink>
                ))}
              </section>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
