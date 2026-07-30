import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">DomiOS</h1>
        <nav>
          <NavLink to="/produtos">Produtos</NavLink>
          <NavLink to="/promocoes">Promoções</NavLink>
          <NavLink to="/receitas">Receitas</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/produtos" replace />} />
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
