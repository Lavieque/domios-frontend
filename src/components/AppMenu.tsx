import { useEffect, useRef, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface MenuLink {
  to: string;
  label: string;
  /** Uma linha a dizer para que serve a página (na gaveta "Mais"). */
  hint: string;
  end?: boolean;
}

/** O dia a dia da casa: os quatro destinos que contam. */
const mainLinks: MenuLink[] = [
  { to: "/", label: "Hoje", hint: "O que se come hoje", end: true },
  { to: "/plano", label: "Semana", hint: "Refeições da semana" },
  { to: "/despensa", label: "Despensa", hint: "O que há em casa" },
  { to: "/listas", label: "Compras", hint: "Listas por fazer" },
];

const kitchenLinks: MenuLink[] = [
  { to: "/cozinhar", label: "Cozinhar", hint: "Com o que tens" },
  { to: "/receitas", label: "Receitas", hint: "Para escolher" },
  { to: "/ementas", label: "Ementas", hint: "Semanas prontas" },
  { to: "/nutricao", label: "Nutrição", hint: "O que se come" },
];

const priceLinks: MenuLink[] = [
  { to: "/produtos", label: "Preços", hint: "Produtos nas lojas" },
  { to: "/promocoes", label: "Promoções", hint: "Descontos em vigor" },
];

const accountLinks: MenuLink[] = [
  { to: "/casa", label: "Casa", hint: "Membros da casa" },
  { to: "/conta", label: "Conta", hint: "Email e password" },
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

function RailGroup({ links, main = false }: { links: MenuLink[]; main?: boolean }) {
  return (
    <div className={main ? "rail-group rail-group-main" : "rail-group"}>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className="rail-link">
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

/** Rail do almanaque no desktop. */
export function AppRail({ brand }: { brand: ReactNode }) {
  return (
    <aside className="app-rail" id="app-rail">
      {brand}
      <nav className="rail-nav" aria-label="Principal">
        <RailGroup links={mainLinks} main />
        <RailGroup links={kitchenLinks} />
        <RailGroup links={priceLinks} />
      </nav>
      <nav className="rail-nav rail-foot" aria-label="Conta">
        <RailGroup links={accountLinks} />
      </nav>
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
