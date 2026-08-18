import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, searchProducts } from "../api/client";
import { measurementUnitLabels, type CategoryDto, type ProductDto } from "../api/types";
import { Pagination } from "../components/Pagination";

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // O catálogo real tem milhares de categorias (incluindo subcategorias
  // profundas) — mostrar todas num filtro rápido não é utilizável. Só as
  // de topo (sem parentCategoryId) vão para o dropdown; pesquisa por texto
  // continua a cobrir o resto.
  const topLevelCategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentCategoryId === null)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [categories],
  );

  useEffect(() => {
    setLoading(true);
    searchProducts(search, page, 20, categoryId ?? undefined)
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, categoryId]);

  return (
    <div className="page">
      <p className="eyebrow">Catálogo</p>
      <h1>Produtos</h1>
      <div className="search-wrap">
        <input
          type="search"
          placeholder="Pesquisar por nome ou marca…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <select
        className="category-select"
        value={categoryId ?? ""}
        onChange={(e) => {
          setCategoryId(e.target.value || null);
          setPage(1);
        }}
      >
        <option value="">Todas as categorias</option>
        {topLevelCategories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.name}
          </option>
        ))}
      </select>

      <p className="results-count">{total} resultados</p>

      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && products.length === 0 ? (
        <p className="empty-state">Sem resultados.</p>
      ) : (
        !loading && (
          <table className="products-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Marca</th>
                <th>Categoria</th>
                <th>Embalagem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.productId}>
                  <td>
                    <Link to={`/produtos/${product.productId}`} className="table-link">
                      {product.name}
                    </Link>
                  </td>
                  <td>{product.brand ?? "—"}</td>
                  <td>
                    <span className="pill pill-muted">{product.category.name}</span>
                  </td>
                  <td className="num">
                    {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
