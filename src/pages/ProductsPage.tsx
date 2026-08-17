import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchProducts } from "../api/client";
import { measurementUnitLabels, type ProductDto } from "../api/types";
import { Pagination } from "../components/Pagination";

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchProducts(search, page)
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div className="page">
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

      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && products.length === 0 ? (
        <p className="empty-state">Sem resultados.</p>
      ) : (
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
                  <Link to={`/produtos/${product.productId}`}>{product.name}</Link>
                </td>
                <td>{product.brand ?? "—"}</td>
                <td>{product.category.name}</td>
                <td className="num">
                  {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
