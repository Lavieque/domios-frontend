import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../auth/useSession";
import { useHouseholds } from "../household/useHouseholds";

/** Cabeçalho da app: botão do menu, pesquisa, a casa escolhida e a conta. */
export function EditorialBar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const session = useSession();
  const { current } = useHouseholds();
  const [query, setQuery] = useState("");

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
        aria-expanded={!collapsed}
        aria-controls="app-rail"
        aria-label={collapsed ? "Mostrar menu lateral" : "Recolher menu lateral"}
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <form className="bar-search" role="search" onSubmit={submit}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          aria-label="Pesquisar produtos"
          placeholder="Pesquisar produtos…"
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
      <Link to="/conta" className="bar-avatar" aria-label="Conta">
        {(session?.email ?? "?").charAt(0).toUpperCase()}
      </Link>
    </header>
  );
}
