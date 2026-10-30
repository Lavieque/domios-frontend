import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, searchProducts } from "../api/client";
import { CategoryScope, measurementUnitLabels, ProductStatus, type CategoryDto, type ProductDto } from "../api/types";
import { aisleClass, aisleOf, topCategory } from "../catalog/aisles";
import { isOnSale, money, sortOffers, unitPriceLabel, useOffers } from "../catalog/offers";
import { AisleSign } from "../components/AisleSign";
import { GroceryOnlyToggle } from "../components/GroceryOnlyToggle";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { LabelPrice, ShelfLabel, VerdictBand } from "../components/ShelfLabel";

const count = new Intl.NumberFormat("pt-PT");
const PAGE_SIZE = 20;
/** Corredores à vista antes de "Mais": o resto da fila ocupava meio ecrã. */
const VISIBLE_AISLES = 8;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId");
  // Ligado por omissão: o scraper lê o catálogo inteiro (brinquedos,
  // decoração); `grocery=0` no URL mostra tudo.
  const groceryOnly = searchParams.get("grocery") !== "0";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  function applyFilters(next: { search?: string; categoryId?: string | null; groceryOnly?: boolean; page?: number }) {
    const nextSearch = next.search ?? search;
    const nextCategoryId = next.categoryId === undefined ? categoryId : next.categoryId;
    const nextGroceryOnly = next.groceryOnly ?? groceryOnly;
    const nextPage = next.page ?? page;

    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (!nextGroceryOnly) params.set("grocery", "0");
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
        .filter((category) => !groceryOnly || category.scope !== CategoryScope.NonGrocery)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [categories, groceryOnly],
  );
  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.categoryId, category])), [categories]);

  const [showAllAisles, setShowAllAisles] = useState(false);
  const canCollapse = topLevelCategories.length > VISIBLE_AISLES;
  // A categoria escolhida fica sempre à vista, mesmo que esteja para lá do corte.
  const visibleCategories =
    showAllAisles || !canCollapse
      ? topLevelCategories
      : topLevelCategories.filter(
          (category, index) => index < VISIBLE_AISLES || category.categoryId === categoryId,
        );
  const hiddenAisleCount = topLevelCategories.length - visibleCategories.length;

  useEffect(() => {
    setLoading(true);
    searchProducts(search, page, PAGE_SIZE, categoryId ?? undefined, groceryOnly)
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, categoryId, groceryOnly]);

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
        <GroceryOnlyToggle value={groceryOnly} onChange={(value) => applyFilters({ groceryOnly: value, page: 1 })} />
      </div>

      {topLevelCategories.length > 0 && (
        <div className="chip-row aisle-row" role="group" aria-label="Categoria">
          <button
            type="button"
            className="chip"
            aria-pressed={categoryId === null}
            onClick={() => applyFilters({ categoryId: null, page: 1 })}
          >
            Todas
          </button>
          {visibleCategories.map((category) => (
            <button
              key={category.categoryId}
              type="button"
              className={`chip ${aisleClass(aisleOf(category.name))}`}
              aria-pressed={categoryId === category.categoryId}
              onClick={() => applyFilters({ categoryId: category.categoryId, page: 1 })}
            >
              <span className="aisle-dot" aria-hidden="true" />
              {category.name}
            </button>
          ))}
          {canCollapse && (
            <button
              type="button"
              className="chip chip-more"
              aria-expanded={showAllAisles}
              onClick={() => setShowAllAisles((open) => !open)}
            >
              {showAllAisles ? "Menos" : `Mais ${hiddenAisleCount}`}
            </button>
          )}
        </div>
      )}

      <p className="results-count">{loading ? "A procurar…" : `${count.format(total)} resultados`}</p>

      {!loading && products.length === 0 ? (
        <p className="empty-state">Sem resultados para esta pesquisa.</p>
      ) : (
        !loading && (
          <div className="label-grid">
            {products.map((product, index) => (
              <ProductLabel
                key={product.productId}
                product={product}
                index={index}
                top={topCategory(product.category, categoriesById)}
              />
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
    </div>
  );
}

/** O produto com a oferta mais barata que a Api conhece (GET /products não traz preços). */
function ProductLabel({ product, index, top }: { product: ProductDto; index: number; top: CategoryDto | null }) {
  const offers = useOffers(product.productId);
  const aisleName = (top ?? product.category).name;
  const aisle = aisleOf(aisleName);
  const priced = offers ? sortOffers(offers).filter(isOnSale) : [];
  const cheapest = priced[0];
  const unit = cheapest ? unitPriceLabel(cheapest) : null;

  let band;
  if (product.status === ProductStatus.Discontinued) band = <VerdictBand tone="none">Descontinuado</VerdictBand>;
  else if (offers === undefined) band = <VerdictBand tone="none">A ler histórico…</VerdictBand>;
  else if (cheapest) band = <VerdictBand insight={cheapest.priceInsight} />;
  else band = <VerdictBand tone="none">Sem preço observado</VerdictBand>;

  return (
    <ShelfLabel
      to={`/produtos/${product.productId}`}
      index={index}
      band={band}
      className={`product-card ${aisleClass(aisle)}`}
      media={
        <div className={`product-photo${product.imageUrl ? "" : " is-empty"}`}>
          <span className="product-photo-tag">
            <span className="aisle-dot" aria-hidden="true" />
            {aisleName}
          </span>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" loading="lazy" />
          ) : (
            <AisleSign aisle={aisle} />
          )}
        </div>
      }
    >
      <div className="label-name">{product.name}</div>
      <div className="label-meta">
        {product.brand ?? "Sem marca"} · {product.packageQuantity} {measurementUnitLabels[product.packageUnit]}
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
