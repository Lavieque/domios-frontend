import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../auth/actions";
import { useAvatar } from "../auth/useAvatar";
import { useSession } from "../auth/useSession";
import { useHouseholds } from "../household/useHouseholds";

interface MenuLink {
  to: string;
  label: string;
  /** Uma linha a dizer para que serve a página (na gaveta "Mais"). */
  hint: string;
  /** Nome mais curto para a barra de baixo, quando o do menu não cabe. */
  tabLabel?: string;
  /** Caminho do ícone de linha do rail (viewBox 24). */
  icon: string;
  end?: boolean;
}

/** O dia a dia da casa: os quatro destinos que contam. */
const mainLinks: MenuLink[] = [
  { to: "/", label: "Hoje", hint: "O que se come hoje", icon: "M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", end: true },
  { to: "/plano", label: "Planeamento", tabLabel: "Plano", hint: "Refeições da semana", icon: "M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M8 14h2m4 0h2m-8 3h2" },
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
  { to: "/lojas", label: "Lojas perto", hint: "E quanto custa ir", icon: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" },
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

/** Os destinos que vão na barra de baixo do telemóvel: o dia a dia e Cozinhar. */
const tabLinks: MenuLink[] = [...mainLinks, kitchenLinks[0]];

/** Tudo o resto, no menu do topo do telemóvel. A casa e a conta vão no cimo da folha. */
const topMenuGroups: { title: string; links: MenuLink[] }[] = [
  { title: "Cozinha", links: kitchenLinks.slice(1) },
  { title: "Preços", links: priceLinks },
];

/** O avatar de quem usa, ou a inicial do email quando não há fotografia. */
function Avatar({ className }: { className: string }) {
  const session = useSession();
  const avatar = useAvatar();
  return (
    <span className={avatar ? `${className} has-photo` : className} aria-hidden="true">
      {avatar ? <img src={avatar} alt="" /> : (session?.email ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

/** Barra de baixo no telemóvel: os cinco destinos de todos os dias, ao alcance do polegar. */
export function AppTabBar() {
  return (
    <nav className="tabbar" aria-label="Principal">
      {tabLinks.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className="tab">
          {tabIcons[link.to] ?? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={link.icon} />
            </svg>
          )}
          {link.tabLabel ?? link.label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Menu do topo no telemóvel: o botão das três linhas, ao lado do avatar, abre uma folha
 * que desce de cima, com a conta e a casa no cimo e, por baixo, o que não cabe na barra de baixo.
 */
export function AppTopMenu() {
  const sheet = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();
  const session = useSession();
  const { current, households } = useHouseholds();
  const navigate = useNavigate();

  async function handleSignOut() {
    sheet.current?.close();
    await signOut();
    navigate("/entrar", { replace: true, state: { notice: "Saíste da conta." } });
  }

  // Ao mudar de página fecha logo, sem animação: a página nova já está a aparecer.
  useEffect(() => sheet.current?.close(), [pathname]);

  /** Fecha a subir: espera pelo fim da animação de saída antes de fechar o dialog. */
  const close = useCallback(() => {
    const dialog = sheet.current;
    if (!dialog?.open || dialog.dataset.closing) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      return;
    }
    dialog.dataset.closing = "true";
    const done = () => {
      delete dialog.dataset.closing;
      dialog.close();
    };
    const panel = dialog.querySelector(".top-menu-panel");
    panel?.addEventListener("animationend", done, { once: true });
    // Se a animação não correr (separador em segundo plano), fecha na mesma.
    window.setTimeout(() => dialog.open && done(), 320);
  }, []);

  const groupActive = topMenuGroups.some((group) => group.links.some((link) => pathname.startsWith(link.to)));
  const active = groupActive || pathname.startsWith("/casa") || pathname.startsWith("/conta");

  return (
    <>
      <button
        type="button"
        className={active ? "top-menu-button active" : "top-menu-button"}
        aria-haspopup="dialog"
        aria-label="Menu"
        onClick={() => sheet.current?.showModal()}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Um toque no fundo cai no próprio dialog, fora do painel: fecha. Esc também fecha a subir. */}
      <dialog
        ref={sheet}
        className="top-menu"
        aria-label="Menu"
        onClick={(e) => e.target === e.currentTarget && close()}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="top-menu-panel">
          <div className="top-menu-account">
            <Link to="/conta" className="top-menu-person">
              <Avatar className="top-menu-person-avatar" />
              <span className="top-menu-text">
                <span className="top-menu-email">{session?.email}</span>
                <span className="top-menu-hint">Conta e definições</span>
              </span>
            </Link>
            <button type="button" className="top-menu-close" aria-label="Fechar menu" onClick={close}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="top-menu-house">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={accountLinks[0].icon} />
            </svg>
            <span className="top-menu-text">
              <span className="top-menu-house-name">{current?.name ?? "A minha casa"}</span>
              <span className="top-menu-hint">
                {households.length > 1 ? `Uma de ${households.length} casas` : "A tua casa"}
              </span>
            </span>
            <span className="top-menu-house-actions">
              {households.length > 1 && (
                <Link to="/conta" className="top-menu-pill">
                  Trocar
                </Link>
              )}
              <Link to="/casa" className="top-menu-pill">
                Gerir
              </Link>
            </span>
          </div>

          <nav aria-label="Menu">
            {topMenuGroups.map((group) => (
              <section key={group.title} className="top-menu-group">
                <h2 className="top-menu-group-title">{group.title}</h2>
                <div className="top-menu-links">
                  {group.links.map((link) => (
                    <NavLink key={link.to} to={link.to} className="top-menu-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={link.icon} />
                      </svg>
                      <span className="top-menu-text">
                        {link.label}
                        <span className="top-menu-hint">{link.hint}</span>
                      </span>
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}

            <section className="top-menu-group">
              <h2 className="top-menu-group-title">Conta</h2>
              <div className="top-menu-links">
                <NavLink to="/conta" className="top-menu-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0" />
                  </svg>
                  <span className="top-menu-text">
                    A minha conta
                    <span className="top-menu-hint">Email, password e foto</span>
                  </span>
                </NavLink>
                <button type="button" className="top-menu-link top-menu-signout" onClick={handleSignOut}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" />
                  </svg>
                  <span className="top-menu-text">Sair</span>
                </button>
              </div>
            </section>
          </nav>
        </div>
      </dialog>
    </>
  );
}
