import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchRecipes } from "../api/client";
import { recipeDifficultyLabels, type RecipeSummaryDto } from "../api/types";
import { Pagination } from "../components/Pagination";

export function RecipesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [recipes, setRecipes] = useState<RecipeSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchRecipes(search, page)
      .then((result) => {
        setRecipes(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div className="page">
      <p className="eyebrow">Cozinha</p>
      <h1>Receitas</h1>
      <div className="search-wrap">
        <input
          type="search"
          placeholder="Pesquisar receitas…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && recipes.length === 0 ? (
        <p className="empty-state">Sem resultados.</p>
      ) : (
        !loading && (
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <Link key={recipe.recipeId} to={`/receitas/${recipe.recipeId}`} className="recipe-card">
                <div className="recipe-card-title">{recipe.title}</div>
                <div className="recipe-card-pills">
                  <span className="pill pill-accent2">{recipeDifficultyLabels[recipe.difficulty]}</span>
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="pill pill-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
