import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { admin, ApiError, login, logout, type Session } from "./api";
import { describe, useLoad, useSession } from "./hooks";
import { CatalogRedirect, IngredientsPage, ProductsPage, PromotionsPage, RecipesPage, StoresPage } from "./pages/CatalogPage";
import { AuditPage } from "./pages/AuditPage";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage";
import { HouseholdsPage } from "./pages/HouseholdsPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SystemPage } from "./pages/SystemPage";
import { UsersPage } from "./pages/UsersPage";

/** Fotografia de fundo por área (ficheiros em admin/public/scenes), sob o mesmo véu verde da app. */
const SCENES: { match: (pathname: string) => boolean; image: string }[] = [
  { match: (p) => p.startsWith("/catalogo/produtos"), image: "produtos" },
  { match: (p) => p.startsWith("/catalogo/receitas"), image: "receitas" },
  { match: (p) => p.startsWith("/catalogo/ingredientes"), image: "cozinhar" },
  { match: (p) => p.startsWith("/catalogo/lojas"), image: "compras" },
  { match: (p) => p.startsWith("/catalogo/promocoes"), image: "promocoes" },
  { match: (p) => p.startsWith("/sistema"), image: "ementas" },
  { match: (p) => p.startsWith("/auditoria"), image: "plano" },
];

function sceneFor(pathname: string): string {
  const found = SCENES.find((s) => s.match(pathname));
  return `/scenes/scene-${found?.image ?? "casa"}.jpg`;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="M4 11.5 12 5l8 6.5M6 10.5V19h12v-8.5" />,
    inbox: <path d="M4 13h4l1.5 2.5h5L16 13h4M5.5 6h13L20 13v5H4v-5z" />,
    user: (
      <>
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5 19c.8-3.2 3.6-5 7-5s6.2 1.8 7 5" />
      </>
    ),
    house: <path d="M3.5 11 12 4l8.5 7M6 10v9h12v-9M10 19v-5h4v5" />,
    box: <path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" />,
    book: <path d="M5 5.5C7.5 4.5 10 4.8 12 6.5c2-1.7 4.5-2 7-1v13c-2.5-1-5-.7-7 1-2-1.7-4.5-2-7-1z M12 6.5V19.5" />,
    leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19c2-4 5-7 9-9" />,
    store: <path d="M4 9.5 5.5 5h13L20 9.5M4 9.5c0 1.4 1 2.3 2.2 2.3S8.4 10.9 8.4 9.5c0 1.4 1 2.3 2.2 2.3s2.2-.9 2.2-2.3c0 1.4 1 2.3 2.2 2.3s2.2-.9 2.2-2.3c0 1.4 1 2.3 2.2 2.3S20 10.9 20 9.5M6 12v7h12v-7" />,
    tag: <path d="M4 12V5h7l9 9-7 7zM8.5 8.5h.01" />,
    pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
    log: <path d="M6 4h12v16H6zM9 8.5h6M9 12h6M9 15.5h4" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const NAV: { items: { to: string; label: string; icon: string; end?: boolean; badge?: boolean }[] }[] = [
  {
    items: [
      { to: "/", label: "Visão geral", icon: "home", end: true },
      { to: "/pedidos", label: "Pedidos", icon: "inbox", badge: true },
    ],
  },
  {
    items: [
      { to: "/utilizadores", label: "Utilizadores", icon: "user" },
      { to: "/casas", label: "Casas", icon: "house" },
    ],
  },
  {
    items: [
      { to: "/catalogo/produtos", label: "Produtos", icon: "box" },
      { to: "/catalogo/receitas", label: "Receitas", icon: "book" },
      { to: "/catalogo/ingredientes", label: "Ingredientes", icon: "leaf" },
      { to: "/catalogo/lojas", label: "Lojas", icon: "store" },
      { to: "/catalogo/promocoes", label: "Promoções", icon: "tag" },
    ],
  },
  {
    items: [
      { to: "/sistema", label: "Sistema", icon: "pulse" },
      { to: "/auditoria", label: "Auditoria", icon: "log" },
    ],
  },
];

function Brand() {
  return (
    <span className="brand">
      <svg className="brand-mark" viewBox="0 0 120 120" aria-hidden="true">
        <polyline points="30,72 30,46 60,20 90,46 90,72" fill="none" stroke="#2a6a78" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="52,88 52,62 82,36 112,62 112,88" fill="none" stroke="#1e3a5c" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="wordmark">
        Domi<em>OS</em>
      </span>
    </span>
  );
}

/** Quantos pedidos esperam decisão: o único número que vive no menu, porque pede ação. */
function usePendingCount(pathname: string): number {
  const pending = useLoad(() => admin.accessRequests("Pending", 1).then((r) => r.total), [pathname]);
  return pending.data ?? 0;
}

export function Admin() {
  const session = useSession();
  return session ? <Shell session={session} /> : <LoginPage />;
}

function Shell({ session }: { session: Session }) {
  const { pathname } = useLocation();
  const pending = usePendingCount(pathname);

  return (
    <div className="admin">
      <div className="scene" style={{ backgroundImage: `url(${sceneFor(pathname)})` }} aria-hidden="true" />
      <aside className="rail">
        <NavLink to="/" aria-label="DomiOS Admin, visão geral" style={{ alignSelf: "flex-start" }}>
          <Brand />
        </NavLink>
        <p className="rail-tag">Administração</p>
        <nav className="rail-nav" aria-label="Principal">
          {NAV.map((group, i) => (
            <div className="rail-group" key={i}>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="rail-link">
                  <Icon name={item.icon} />
                  {item.label}
                  {item.badge && pending > 0 && <span className="rail-badge" aria-label={`${pending} por avaliar`}>{pending}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="rail-user">
          <span className="rail-user-who" title={session.email}>
            <span className="rail-user-dot" aria-hidden="true" />
            <span>{session.email}</span>
          </span>
          <button type="button" className="link-button" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </aside>
      <div className="admin-column">
        <main className="admin-main">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/entrar" element={<Navigate to="/" replace />} />
            <Route path="/pedidos" element={<RequestsPage />} />
            <Route path="/utilizadores" element={<UsersPage selfId={session.userId} />} />
            <Route path="/casas" element={<HouseholdsPage />} />
            <Route path="/casas/:id" element={<HouseholdDetailPage />} />
            <Route path="/catalogo" element={<CatalogRedirect />} />
            <Route path="/catalogo/produtos" element={<ProductsPage />} />
            <Route path="/catalogo/receitas" element={<RecipesPage />} />
            <Route path="/catalogo/ingredientes" element={<IngredientsPage />} />
            <Route path="/catalogo/lojas" element={<StoresPage />} />
            <Route path="/catalogo/promocoes" element={<PromotionsPage />} />
            <Route path="/sistema" element={<SystemPage />} />
            <Route path="/auditoria" element={<AuditPage />} />
            <Route path="*" element={<p className="muted">Esta página não existe.</p>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email ou password errados."
          : err instanceof ApiError && err.type === "not-admin"
            ? err.message
            : describe(err),
      );
      setBusy(false);
    }
  }

  return (
    <>
      <div className="scene" style={{ backgroundImage: "url(/scenes/scene-casa.jpg)" }} aria-hidden="true" />
      <div className="login">
        <Brand />
        <section className="panel login-panel">
          <h1>Entrar</h1>
          <p className="page-sub">Administração da plataforma. Só para contas de administrador.</p>
          <form className="login-form" onSubmit={submit}>
            <label className="form-field">
              <span>Email</span>
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="button-primary" disabled={busy}>
              {busy ? "A entrar…" : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
