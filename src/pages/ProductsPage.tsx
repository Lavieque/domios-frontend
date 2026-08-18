import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const chipRowRef = useRef<HTMLDivElement>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [categoriesOverflow, setCategoriesOverflow] = useState(false);
  const [chipRowHeight, setChipRowHeight] = useState<number | null>(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useLayoutEffect(() => {
    const container = chipRowRef.current;
    if (!container) return;

    function measure() {
      const firstChip = container!.querySelector<HTMLElement>(".chip");
      if (!firstChip) {
        setChipRowHeight(null);
        setCategoriesOverflow(false);
        return;
      }
      setChipRowHeight(firstChip.offsetHeight);
      setCategoriesOverflow(container!.scrollHeight > firstChip.offsetHeight + 4);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [categories]);

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

      <div
        className="chip-row"
        ref={chipRowRef}
        style={categoriesExpanded || chipRowHeight === null ? undefined : { maxHeight: chipRowHeight, overflow: "hidden" }}
      >
        <button
          type="button"
          className={`chip${categoryId === null ? " chip-active" : ""}`}
          onClick={() => {
            setCategoryId(null);
            setPage(1);
          }}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.categoryId}
            type="button"
            className={`chip${categoryId === category.categoryId ? " chip-active" : ""}`}
            onClick={() => {
              setCategoryId(category.categoryId);
              setPage(1);
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
      {categoriesOverflow && (
        <button type="button" className="chip-toggle" onClick={() => setCategoriesExpanded((v) => !v)}>
          {categoriesExpanded ? "Mostrar menos" : "Mostrar mais categorias"}
        </button>
      )}

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
