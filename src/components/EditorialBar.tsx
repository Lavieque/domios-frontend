import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAvatar } from "../auth/useAvatar";
import { useSession } from "../auth/useSession";
import { useHouseholds } from "../household/useHouseholds";
import { useIsPhone } from "../usePageSize";
import { AppTopMenu } from "./AppMenu";

/** Cabeçalho da app: botão do menu, pesquisa, a casa escolhida e a conta. */
export function EditorialBar({
  brand,
  collapsed,
  menuOpen,
  onToggle,
}: {
  /** O logótipo: só aparece no telemóvel, onde não há menu lateral. */
  brand: ReactNode;
  collapsed: boolean;
  menuOpen: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const session = useSession();
  const avatar = useAvatar();
  const { current } = useHouseholds();
  const [query, setQuery] = useState("");
  // No telemóvel a caixa é curta: o texto de ajuda também.
  const phone = useIsPhone();

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/produtos?search=${encodeURIComponent(term)}` : "/produtos");
  }

  return (
    <header className="editorial-bar">
      <button
        type="button"
        className="rail-toggle"
        aria-controls="app-rail"
        aria-label={collapsed && !menuOpen ? "Mostrar menu lateral" : "Menu lateral"}
        data-collapsed={collapsed}
        data-open={menuOpen}
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="bar-brand">{brand}</div>

      <form className="bar-search" role="search" onSubmit={submit}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          aria-label="Pesquisar produtos"
          placeholder={phone ? "Pesquisar…" : "Pesquisar produtos…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <Link to="/casa" className="bar-house">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 11l9-8 9 8M5 10v11h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {current?.name ?? "A minha casa"}
      </Link>
      <Link to="/conta" className={`bar-avatar${avatar ? " has-photo" : ""}`} aria-label="Conta">
        {avatar ? <img src={avatar} alt="" /> : (session?.email ?? "?").charAt(0).toUpperCase()}
      </Link>

      {/* Só no telemóvel: o que não cabe na barra de baixo, depois da conta. */}
      <div className="bar-menu">
        <AppTopMenu />
      </div>
    </header>
  );
}
