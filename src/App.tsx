import { lazy, Suspense, useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { useSession } from "./auth/useSession";
import { AppRail, AppTabBar } from "./components/AppMenu";
import { EditorialBar } from "./components/EditorialBar";
import { EmailVerificationNotice } from "./components/EmailVerificationNotice";
import { PageSkeleton } from "./components/PageSkeleton";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { editorialScene, readRailCollapsed, writeRailCollapsed } from "./editorial";
import { REQUEST_ACCESS_URL } from "./siteUrl";


// Cada página é um ficheiro à parte, pedido só quando é precisa: o arranque
// carrega só o essencial. Hoje e Entrar ficam no ficheiro principal (são a
// primeira página de quase todas as visitas). Depois de a app abrir, as outras
// são pedidas em segundo plano, para que mudar de página não espere pela rede.
const pageLoaders = {
  AccountPage: () => import("./pages/AccountPage").then((m) => ({ default: m.AccountPage })),
  AddPantryItemPage: () => import("./pages/AddPantryItemPage").then((m) => ({ default: m.AddPantryItemPage })),
  CookPage: () => import("./pages/CookPage").then((m) => ({ default: m.CookPage })),
  CookedRecipesPage: () => import("./pages/CookedRecipesPage").then((m) => ({ default: m.CookedRecipesPage })),
  CreateHouseholdPage: () => import("./pages/CreateHouseholdPage").then((m) => ({ default: m.CreateHouseholdPage })),
  ForgotPasswordPage: () => import("./pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
  HouseholdHistoryPage: () => import("./pages/HouseholdHistoryPage").then((m) => ({ default: m.HouseholdHistoryPage })),
  HouseholdPage: () => import("./pages/HouseholdPage").then((m) => ({ default: m.HouseholdPage })),
  MealPlanTemplateDetailPage: () => import("./pages/MealPlanTemplateDetailPage").then((m) => ({ default: m.MealPlanTemplateDetailPage })),
  MealPlanTemplatesPage: () => import("./pages/MealPlanTemplatesPage").then((m) => ({ default: m.MealPlanTemplatesPage })),
  PantryPage: () => import("./pages/PantryPage").then((m) => ({ default: m.PantryPage })),
  PlanPage: () => import("./pages/PlanPage").then((m) => ({ default: m.PlanPage })),
  NutritionPage: () => import("./pages/NutritionPage").then((m) => ({ default: m.NutritionPage })),
  ProductsPage: () => import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })),
  ProductDetailPage: () => import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })),
  PromotionsPage: () => import("./pages/PromotionsPage").then((m) => ({ default: m.PromotionsPage })),
  RecipesPage: () => import("./pages/RecipesPage").then((m) => ({ default: m.RecipesPage })),
  RecipeDetailPage: () => import("./pages/RecipeDetailPage").then((m) => ({ default: m.RecipeDetailPage })),
  RegisterPage: () => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
  ShoppingListPage: () => import("./pages/ShoppingListPage").then((m) => ({ default: m.ShoppingListPage })),
  ShoppingListsPage: () => import("./pages/ShoppingListsPage").then((m) => ({ default: m.ShoppingListsPage })),
  SpendingPage: () => import("./pages/SpendingPage").then((m) => ({ default: m.SpendingPage })),
  NearbyStoresPage: () => import("./pages/NearbyStoresPage").then((m) => ({ default: m.NearbyStoresPage })),
  PantryWastePage: () => import("./pages/PantryWastePage").then((m) => ({ default: m.PantryWastePage })),
  ResetPasswordPage: () => import("./pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
  VerifyEmailPage: () => import("./pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })),
};
const AccountPage = lazy(pageLoaders.AccountPage);
const AddPantryItemPage = lazy(pageLoaders.AddPantryItemPage);
const CookPage = lazy(pageLoaders.CookPage);
const CookedRecipesPage = lazy(pageLoaders.CookedRecipesPage);
const CreateHouseholdPage = lazy(pageLoaders.CreateHouseholdPage);
const ForgotPasswordPage = lazy(pageLoaders.ForgotPasswordPage);
const HouseholdHistoryPage = lazy(pageLoaders.HouseholdHistoryPage);
const HouseholdPage = lazy(pageLoaders.HouseholdPage);
const MealPlanTemplateDetailPage = lazy(pageLoaders.MealPlanTemplateDetailPage);
const MealPlanTemplatesPage = lazy(pageLoaders.MealPlanTemplatesPage);
const PantryPage = lazy(pageLoaders.PantryPage);
const PlanPage = lazy(pageLoaders.PlanPage);
const NutritionPage = lazy(pageLoaders.NutritionPage);
const ProductsPage = lazy(pageLoaders.ProductsPage);
const ProductDetailPage = lazy(pageLoaders.ProductDetailPage);
const PromotionsPage = lazy(pageLoaders.PromotionsPage);
const RecipesPage = lazy(pageLoaders.RecipesPage);
const RecipeDetailPage = lazy(pageLoaders.RecipeDetailPage);
const RegisterPage = lazy(pageLoaders.RegisterPage);
const ShoppingListPage = lazy(pageLoaders.ShoppingListPage);
const ShoppingListsPage = lazy(pageLoaders.ShoppingListsPage);
const SpendingPage = lazy(pageLoaders.SpendingPage);
const NearbyStoresPage = lazy(pageLoaders.NearbyStoresPage);
const PantryWastePage = lazy(pageLoaders.PantryWastePage);
const ResetPasswordPage = lazy(pageLoaders.ResetPasswordPage);
const VerifyEmailPage = lazy(pageLoaders.VerifyEmailPage);

function preloadPages() {
  for (const load of Object.values(pageLoaders)) void load().catch(() => undefined);
}

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

  useEffect(() => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(preloadPages);
    else setTimeout(preloadPages, 1500);
  }, []);
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
          <EditorialBar brand={brand} collapsed={railCollapsed} menuOpen={menuOpen} onToggle={toggleRail} />
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
        <Suspense fallback={<PageSkeleton />}>
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
            <Route path="/despensa/desperdicio" element={<PantryWastePage />} />
            <Route path="/cozinhar" element={<CookPage />} />
            <Route path="/cozinhar/feitas" element={<CookedRecipesPage />} />
            <Route path="/listas" element={<ShoppingListsPage />} />
            <Route path="/listas/:id" element={<ShoppingListPage />} />
            <Route path="/gastos" element={<SpendingPage />} />
            <Route path="/lojas" element={<NearbyStoresPage />} />
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
        </Suspense>
      </main>

      <footer className="app-footer">
        <span>DomiOS · A casa, em harmonia</span>
        <span>Preços observados nas lojas acompanhadas</span>
      </footer>
      </div>
      {/* No telemóvel a navegação fica em baixo, ao alcance do polegar. */}
      {session && <AppTabBar />}
    </div>
  );
}

export default App;
