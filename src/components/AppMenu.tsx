import { useEffect, useRef, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSession } from "../auth/useSession";

interface MenuLink {
  to: string;
  label: string;
  /** Uma linha a dizer para que serve a página (na gaveta "Mais"). */
  hint: string;
  /** Caminho do ícone de linha do rail (viewBox 24). */
  icon: string;
  end?: boolean;
}

/** O dia a dia da casa: os quatro destinos que contam. */
const mainLinks: MenuLink[] = [
  { to: "/", label: "Hoje", hint: "O que se come hoje", icon: "M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", end: true },
  { to: "/plano", label: "Planeamento", hint: "Refeições da semana", icon: "M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M8 14h2m4 0h2m-8 3h2" },
  { to: "/despensa", label: "Despensa", hint: "O que há em casa", icon: "M4 3h16v18H4z M4 12h16 M10 8h4m-4 8h4" },
  { to: "/listas", label: "Compras", hint: "Listas por fazer", icon: "M2 3h3l3 12h11l2-8H6 M9 20h.01m9 0h.01" },
];

const kitchenLinks: MenuLink[] = [
  { to: "/cozinhar", label: "Cozinhar", hint: "Com o que tens", icon: "M5 10h14v9H5z M3 12h2m14 0h2 M4 8h16 M10 5h4" },
  { to: "/receitas", label: "Receitas", hint: "Para escolher", icon: "M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14" },
  { to: "/ementas", label: "Ementas", hint: "Semanas prontas", icon: "M6 3h12v18H6z M9 8h6m-6 4h6m-6 4h4" },
  { to: "/nutricao", label: "Nutrição", hint: "O que se come", icon: "M12 20 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6z M8 12h2l2-3 2 5 2-2" },
];

const priceLinks: MenuLink[] = [
  { to: "/produtos", label: "Produtos", hint: "Produtos nas lojas", icon: "M3 7 12 3l9 4v10l-9 4-9-4z M3 7l9 4 9-4m-9 4v10" },
  { to: "/promocoes", label: "Promoções", hint: "Descontos em vigor", icon: "M3 4h8l10 10-7 7L3 10z M7 8h.01" },
  { to: "/gastos", label: "Gastos", hint: "Quanto se gastou", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
];

const accountLinks: MenuLink[] = [
  { to: "/casa", label: "Casa", hint: "Membros da casa", icon: "M3 11l9-8 9 8 M5 10v11h14V10 M10 21v-6h4v6" },
  { to: "/conta", label: "Definições", hint: "Email e password", icon: "M4 6h16 M4 12h16 M4 18h16 M8 4v4 M16 10v4 M10 16v4" },
];

const tabIcons: Record<string, ReactNode> = {
  "/": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4 9.5h16M8.5 3v4M15.5 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 13.5h4M12 13.5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "/plano": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 4v4M8 10v4M8 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "/despensa": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3.5h8M9 3.5v3.2L6.5 9.5v10h11v-10L15 6.7V3.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6.5 13h11" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  "/listas": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 5h2.2l2 10.5h10.6l1.9-7.5H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="19.2" r="1.4" fill="currentColor" />
      <circle cx="17" cy="19.2" r="1.4" fill="currentColor" />
    </svg>
  ),
};

function RailGroup({ links }: { links: MenuLink[] }) {
  return (
    <div className="rail-group">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className="rail-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={link.icon} />
          </svg>
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

/** Menu lateral: o logótipo, as duas famílias de destinos e a pessoa com sessão. */
export function AppRail({ brand }: { brand: ReactNode }) {
  const session = useSession();
  return (
    <aside className="app-rail" id="app-rail">
      {brand}
      <p className="rail-tagline">A casa, em harmonia</p>
      <nav className="rail-nav" aria-label="Principal">
        <RailGroup links={[...mainLinks, ...kitchenLinks.slice(0, 3)]} />
        <RailGroup links={[kitchenLinks[3], ...priceLinks, ...accountLinks]} />
      </nav>
      {session && (
        <NavLink to="/conta" className="rail-user">
          <span className="rail-user-dot" aria-hidden="true" />
          {session.email}
        </NavLink>
      )}
    </aside>
  );
}

/**
 * Barra de baixo no telemóvel: os quatro destinos do dia a dia e "Mais", ao alcance do polegar.
 * "Mais" abre uma folha por baixo com o resto.
 */
export function AppTabBar() {
  const drawer = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();

  // Fecha ao mudar de página.
  useEffect(() => drawer.current?.close(), [pathname]);

  const moreActive = [...kitchenLinks, ...priceLinks, ...accountLinks].some((link) => pathname.startsWith(link.to));

  return (
    <>
      <nav className="tabbar" aria-label="Principal">
        {mainLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="tab">
            {tabIcons[link.to]}
            {link.label}
          </NavLink>
        ))}
        <button
          type="button"
          className={moreActive ? "tab active" : "tab"}
          aria-haspopup="dialog"
          onClick={() => drawer.current?.showModal()}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="5.5" cy="12" r="1.8" fill="currentColor" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
            <circle cx="18.5" cy="12" r="1.8" fill="currentColor" />
          </svg>
          Mais
        </button>
      </nav>

      {/* Um toque no fundo cai no próprio dialog, fora do painel: fecha. */}
      <dialog
        ref={drawer}
        className="more-drawer"
        aria-label="Mais"
        onClick={(e) => e.target === e.currentTarget && drawer.current?.close()}
      >
        <div className="more-drawer-panel">
          <div className="more-drawer-head">
            <span className="more-drawer-title">Mais</span>
            <button type="button" className="more-close" onClick={() => drawer.current?.close()}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Fechar
            </button>
          </div>
          <nav aria-label="Mais">
            {[kitchenLinks, priceLinks, accountLinks].map((links, index) => (
              <div key={index} className="rail-group">
                {links.map((link) => (
                  <NavLink key={link.to} to={link.to} className="rail-link">
                    {link.label}
                    <span className="rail-link-hint">{link.hint}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
