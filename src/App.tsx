import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { useSession } from "./auth/useSession";
import { AppRail } from "./components/AppMenu";
import { EditorialBar } from "./components/EditorialBar";
import { EmailVerificationNotice } from "./components/EmailVerificationNotice";
import { AccountPage } from "./pages/AccountPage";
import { AddPantryItemPage } from "./pages/AddPantryItemPage";
import { CookPage } from "./pages/CookPage";
import { CookedRecipesPage } from "./pages/CookedRecipesPage";
import { CreateHouseholdPage } from "./pages/CreateHouseholdPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HouseholdHistoryPage } from "./pages/HouseholdHistoryPage";
import { HouseholdPage } from "./pages/HouseholdPage";
import { LoginPage } from "./pages/LoginPage";
import { MealPlanTemplateDetailPage } from "./pages/MealPlanTemplateDetailPage";
import { MealPlanTemplatesPage } from "./pages/MealPlanTemplatesPage";
import { PantryPage } from "./pages/PantryPage";
import { PlanPage } from "./pages/PlanPage";
import { NutritionPage } from "./pages/NutritionPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { ShoppingListsPage } from "./pages/ShoppingListsPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { editorialScene, readRailCollapsed, writeRailCollapsed } from "./editorial";
import { REQUEST_ACCESS_URL } from "./siteUrl";

/** Onde o próprio ecrã já trata do email por confirmar. */
const PATHS_WITHOUT_VERIFICATION_NOTICE = ["/conta", "/verify-email"];

function App() {
  const session = useSession();
  const { pathname } = useLocation();
  const showVerificationNotice =
    session !== null && !session.emailVerified && !PATHS_WITHOUT_VERIFICATION_NOTICE.includes(pathname);

  const scene = editorialScene(pathname);
  const [railCollapsed, setRailCollapsed] = useState(readRailCollapsed);
  // No telemóvel o mesmo botão abre o menu por cima da página; no ecrã largo recolhe-o.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);
  function toggleRail() {
    if (window.matchMedia("(max-width: 899px)").matches) {
      setMenuOpen((open) => !open);
      return;
    }
    setRailCollapsed((collapsed) => {
      writeRailCollapsed(!collapsed);
      return !collapsed;
    });
  }

  const brand = (
    <NavLink to="/" className="brand" aria-label="DomiOS, Hoje">
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
  );

  return (
    <div
      data-area={scene.area}
      className={`app editorial${session ? "" : " app-guest"}${session && railCollapsed ? " rail-collapsed" : ""}${menuOpen ? " menu-open" : ""}`}
    >
      <div className="editorial-scene" style={{ backgroundImage: `url(${scene.image})` }} aria-hidden="true" />
      {session && <AppRail brand={brand} />}
      {menuOpen && <button type="button" className="menu-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <div className="app-column">
      {session ? (
        <>
          <EditorialBar collapsed={railCollapsed} menuOpen={menuOpen} onToggle={toggleRail} />
        </>
      ) : (
        <header className="guest-header">
          {brand}
          <nav className="guest-nav" aria-label="Conta">
            <a href={REQUEST_ACCESS_URL}>Pedir acesso</a>
            <NavLink to="/entrar">Entrar</NavLink>
          </nav>
        </header>
      )}

      {showVerificationNotice && (
        <div className="app-notice">
          <EmailVerificationNotice />
        </div>
      )}

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
            <Route path="/ementas" element={<MealPlanTemplatesPage />} />
            <Route path="/ementas/:id" element={<MealPlanTemplateDetailPage />} />
            <Route path="/plano" element={<PlanPage />} />
            <Route path="/nutricao" element={<NutritionPage />} />
            <Route path="/despensa" element={<PantryPage />} />
            <Route path="/despensa/adicionar" element={<AddPantryItemPage />} />
            <Route path="/cozinhar" element={<CookPage />} />
            <Route path="/cozinhar/feitas" element={<CookedRecipesPage />} />
            <Route path="/listas" element={<ShoppingListsPage />} />
            <Route path="/listas/:id" element={<ShoppingListPage />} />
            <Route path="/casa" element={<HouseholdPage />} />
            <Route path="/casa/nova" element={<CreateHouseholdPage />} />
            <Route path="/casa/historico" element={<HouseholdHistoryPage />} />
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

      <footer className="app-footer">
        <span>DomiOS · A casa, em harmonia</span>
        <span>Preços observados nas lojas acompanhadas</span>
      </footer>
      </div>
    </div>
  );
}

export default App;
