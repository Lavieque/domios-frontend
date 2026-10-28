import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, searchProducts } from "../api/client";
import { measurementUnitLabels, ProductStatus, type CategoryDto, type ProductDto } from "../api/types";
import { isOnSale, money, sortOffers, unitPriceLabel, useOffers } from "../catalog/offers";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { LabelPrice, ShelfLabel, VerdictBand } from "../components/ShelfLabel";

const count = new Intl.NumberFormat("pt-PT");
const PAGE_SIZE = 20;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId");
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  function applyFilters(next: { search?: string; categoryId?: string | null; page?: number }) {
    const nextSearch = next.search ?? search;
    const nextCategoryId = next.categoryId === undefined ? categoryId : next.categoryId;
    const nextPage = next.page ?? page;

    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    // hasProducts=true — o catálogo real tem categorias que nunca têm
    // nenhum produto ligado (ver DomiOS_API_MVP.md); sem este filtro o
    // dropdown mostrava opções que devolviam sempre "sem resultados".
    getCategories(true).then(setCategories);
  }, []);

  // O catálogo real tem milhares de categorias (incluindo subcategorias
  // profundas) — mostrar todas num filtro rápido não é utilizável. Só as
  // de topo (sem parentCategoryId) vão para o dropdown; pesquisa por texto
  // continua a cobrir o resto. GET /products?categoryId= já inclui os
  // produtos das subcategorias de cada categoria de topo.
  const topLevelCategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentCategoryId === null)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [categories],
  );

  useEffect(() => {
    setLoading(true);
    searchProducts(search, page, PAGE_SIZE, categoryId ?? undefined)
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, categoryId]);

  return (
    <div className="page">
      <h1>Produtos</h1>
      <p className="page-sub">Preços observados nas lojas, com o veredicto do histórico de cada oferta.</p>

      <div className="toolbar">
        <SearchField
          label="Pesquisar produtos"
          placeholder="Pesquisar por nome ou marca…"
          value={search}
          onChange={(value) => applyFilters({ search: value, page: 1 })}
        />
        <select
          className="category-select"
          aria-label="Categoria"
          value={categoryId ?? ""}
          onChange={(e) => applyFilters({ categoryId: e.target.value || null, page: 1 })}
        >
          <option value="">Todas as categorias</option>
          {topLevelCategories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <p className="results-count">{loading ? "A procurar…" : `${count.format(total)} resultados`}</p>

      {!loading && products.length === 0 ? (
        <p className="empty-state">Sem resultados para esta pesquisa.</p>
      ) : (
        !loading && (
          <div className="label-grid">
            {products.map((product, index) => (
              <ProductLabel key={product.productId} product={product} index={index} />
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
    </div>
  );
}

/** O produto com a oferta mais barata que a Api conhece (GET /products não traz preços). */
function ProductLabel({ product, index }: { product: ProductDto; index: number }) {
  const offers = useOffers(product.productId);
  const priced = offers ? sortOffers(offers).filter(isOnSale) : [];
  const cheapest = priced[0];
  const unit = cheapest ? unitPriceLabel(cheapest) : null;

  let band;
  if (product.status === ProductStatus.Discontinued) band = <VerdictBand tone="none">Descontinuado</VerdictBand>;
  else if (offers === undefined) band = <VerdictBand tone="none">A ler histórico…</VerdictBand>;
  else if (cheapest) band = <VerdictBand insight={cheapest.priceInsight} />;
  else band = <VerdictBand tone="none">Sem preço observado</VerdictBand>;

  return (
    <ShelfLabel to={`/produtos/${product.productId}`} index={index} band={band}>
      <div className="label-head">
        <div>
          <div className="label-name">{product.name}</div>
          <div className="label-meta">
            {product.brand ?? "Sem marca"} · {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
          </div>
        </div>
        {product.imageUrl && <img className="label-thumb" src={product.imageUrl} alt="" loading="lazy" />}
      </div>
      {(offers === undefined || cheapest) && (
        <LabelPrice amount={offers === undefined ? undefined : cheapest?.latestPrice?.price.amount} from={priced.length > 1} />
      )}
      {cheapest && (
        <div className="label-unit">
          {unit && <strong>{unit}</strong>}
          {unit && " · "}
          {cheapest.chainName}
          {priced.length > 1 && ` · ${priced.length} lojas`}
        </div>
      )}
      {cheapest?.cardPrice && (
        <div className="label-card">{money.format(cheapest.cardPrice.amount)} com cartão</div>
      )}
    </ShelfLabel>
  );
}
