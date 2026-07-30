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
    <div>
      <h1>Produtos</h1>
      <input
        type="search"
        placeholder="Pesquisar por nome ou marca…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {loading && <p className="muted">A carregar…</p>}

      <table>
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
              <td>
                {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && products.length === 0 && <p className="muted">Sem resultados.</p>}

      <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </div>
  );
}
