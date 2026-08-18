import { NavLink, Route, Routes } from "react-router-dom";
import { OverviewPage } from "./pages/OverviewPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";

function App() {
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
          <NavLink to="/" end>
            Visão geral
          </NavLink>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/promocoes">Promoções</NavLink>
          <NavLink to="/receitas">Receitas</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/produtos/:id" element={<ProductDetailPage />} />
          <Route path="/promocoes" element={<PromotionsPage />} />
          <Route path="/receitas" element={<RecipesPage />} />
          <Route path="/receitas/:id" element={<RecipeDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
