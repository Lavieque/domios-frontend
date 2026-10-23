import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { useSession } from "./auth/useSession";
import { EmailVerificationNotice } from "./components/EmailVerificationNotice";
import { AccountPage } from "./pages/AccountPage";
import { CreateHouseholdPage } from "./pages/CreateHouseholdPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HouseholdPage } from "./pages/HouseholdPage";
import { LoginPage } from "./pages/LoginPage";
import { PlanPage } from "./pages/PlanPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

/** Onde o próprio ecrã já trata do email por confirmar. */
const PATHS_WITHOUT_VERIFICATION_NOTICE = ["/conta", "/verify-email"];

function App() {
  const session = useSession();
  const { pathname } = useLocation();
  const showVerificationNotice =
    session !== null && !session.emailVerified && !PATHS_WITHOUT_VERIFICATION_NOTICE.includes(pathname);

  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/" className="brand">
          <svg className="brand-mark" viewBox="0 0 120 120" aria-hidden="true">
            <polyline
              points="30,72 30,46 60,20 90,46 90,72"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="52,88 52,62 82,36 112,62 112,88"
              fill="none"
              stroke="var(--accent-2)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="wordmark">
            Domi<em>OS</em>
          </span>
        </NavLink>
        <nav>
          {session ? (
            <>
              <NavLink to="/" end>
                Visão geral
              </NavLink>
              <NavLink to="/produtos">Produtos</NavLink>
              <NavLink to="/promocoes">Promoções</NavLink>
              <NavLink to="/receitas">Receitas</NavLink>
              <NavLink to="/plano">Plano</NavLink>
              <NavLink to="/casa">Casa</NavLink>
              <NavLink to="/conta" className="nav-account" title={session.email}>
                Conta
              </NavLink>
            </>
          ) : (
            <NavLink to="/entrar" className="nav-account">
              Entrar
            </NavLink>
          )}
        </nav>
      </header>

      {showVerificationNotice && <EmailVerificationNotice />}

      <main className="app-main">
        <Routes>
          {/* Nada do DomiOS é visível sem sessão, catálogos incluídos. */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/produtos/:id" element={<ProductDetailPage />} />
            <Route path="/promocoes" element={<PromotionsPage />} />
            <Route path="/receitas" element={<RecipesPage />} />
            <Route path="/receitas/:id" element={<RecipeDetailPage />} />
            <Route path="/plano" element={<PlanPage />} />
            <Route path="/casa" element={<HouseholdPage />} />
            <Route path="/casa/nova" element={<CreateHouseholdPage />} />
            <Route path="/conta" element={<AccountPage />} />
          </Route>
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/registar" element={<RegisterPage />} />
          <Route path="/esqueci-password" element={<ForgotPasswordPage />} />
          {/* Caminhos fixados pela Api nos links dos emails (AuthEmails.cs). */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
