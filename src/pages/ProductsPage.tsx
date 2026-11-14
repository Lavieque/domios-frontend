import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, searchProducts } from "../api/client";
import { CategoryScope, ProductStatus, type CategoryDto, type ProductDto } from "../api/types";
import { topCategory } from "../catalog/aisles";
import { formatPackage } from "../catalog/package";
import { isOnSale, money, sortOffers, unitPriceLabel, useOffers } from "../catalog/offers";
import { Pagination } from "../components/Pagination";
import { SearchField } from "../components/SearchField";
import { ProductThumb } from "../components/ProductThumb";
import { LabelPrice, ShelfLabel, VerdictBand } from "../components/ShelfLabel";
import { usePageSize } from "../usePageSize";
import { numberFormat } from "../i18n/format";
import { tr, type Dict } from "../i18n";

const count = numberFormat();

/** Grupos da barra de filtros, pela ordem em que aparecem. */
const SCOPE_GROUPS: { scope: CategoryScope; label: keyof Dict["products"]["scopes"] }[] = [
  { scope: CategoryScope.Food, label: "food" },
  { scope: CategoryScope.Household, label: "household" },
  { scope: CategoryScope.NonGrocery, label: "nonGrocery" },
  { scope: CategoryScope.Unclassified, label: "unclassified" },
];
/** Categorias à vista por grupo antes de "Mais N". */
const GROUP_PREVIEW = 8;

export function ProductsPage() {
  const pageSize = usePageSize(20, 10);
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
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.categoryId, category])),
    [categories],
  );

  // No telemóvel a barra lateral fecha-se atrás de "Filtros", como em
  // Promoções; no ecrã largo fica sempre à vista, à esquerda da grelha.
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = (categoryId ? 1 : 0) + (groceryOnly ? 0 : 1);

  // Centenas de categorias de topo entre cadeias: agrupadas pelo âmbito que a
  // Api lhes dá, cada grupo dobrável, em vez de uma fila de chips sem fim.
  const groups = useMemo(
    () =>
      SCOPE_GROUPS.map((group) => ({
        ...group,
        categories: topLevelCategories.filter((category) => category.scope === group.scope),
      })).filter((group) => group.categories.length > 0),
    [topLevelCategories],
  );
  const selectedScope = categoryId ? categoriesById.get(categoryId)?.scope : undefined;
  // Só Alimentação aberta à partida; o grupo da categoria escolhida abre-se
  // sozinho para ela nunca ficar escondida.
  const [openGroups, setOpenGroups] = useState<Set<CategoryScope>>(() => new Set([CategoryScope.Food]));
  useEffect(() => {
    if (selectedScope === undefined) return;
    setOpenGroups((open) => (open.has(selectedScope) ? open : new Set(open).add(selectedScope)));
  }, [selectedScope]);

  function toggleGroup(scope: CategoryScope) {
    setOpenGroups((open) => {
      const next = new Set(open);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  // "Mais N" por grupo: só as primeiras categorias à vista, o resto a pedido.
  const [expandedGroups, setExpandedGroups] = useState<Set<CategoryScope>>(() => new Set());
  function toggleExpanded(scope: CategoryScope) {
    setExpandedGroups((expanded) => {
      const next = new Set(expanded);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  useEffect(() => {
    setLoading(true);
    searchProducts(search, page, pageSize, categoryId ?? undefined, groceryOnly)
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, pageSize, categoryId, groceryOnly]);

  const selectedCategory = categoryId ? categoriesById.get(categoryId) : undefined;
  // Primeira carga sem nada para mostrar; depois a grelha anterior fica à
  // vista, esbatida, em vez de desaparecer e saltar a cada filtro.
  const firstLoad = loading && products.length === 0;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{tr().products.title}</h1>
          <p className="page-head-sub">{tr().products.subtitle}</p>
        </div>
      </header>

      <div className="catalog-layout">
        <div className="toolbar catalog-toolbar">
          <SearchField
            label={tr().products.search}
            placeholder={tr().products.searchPlaceholder}
            value={search}
            onChange={(value) => applyFilters({ search: value, page: 1 })}
          />
          <button
            type="button"
            className="chip chip-more filters-toggle"
            aria-expanded={showFilters}
            aria-controls="product-filters"
            onClick={() => setShowFilters((open) => !open)}
          >
            {activeFilterCount > 0 ? tr().promotions.filtersCount(activeFilterCount) : tr().products.filters}
          </button>
        </div>

        <aside className={`filter-sidebar${showFilters ? " is-open" : ""}`} id="product-filters" aria-label={tr().products.filters}>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={groceryOnly}
              onChange={(e) => applyFilters({ groceryOnly: e.target.checked, page: 1 })}
            />
            <span>
              {tr().ui.groceryOnly}
              <span className="filter-check-hint">{tr().products.groceryHint}</span>
            </span>
          </label>

          {groups.length > 0 && (
            <button
              type="button"
              className="filter-option filter-option-all"
              aria-pressed={categoryId === null}
              onClick={() => applyFilters({ categoryId: null, page: 1 })}
            >
              {tr().lists2.allCategories}
            </button>
          )}

          {groups.map((group) => {
            const open = openGroups.has(group.scope);
            const listId = `filter-group-${group.scope}`;
            const expanded = expandedGroups.has(group.scope);
            // A escolhida fica sempre à vista, mesmo para lá do corte.
            const shown = expanded
              ? group.categories
              : group.categories.filter(
                  (category, index) => index < GROUP_PREVIEW || category.categoryId === categoryId,
                );
            const rest = group.categories.length - shown.length;
            return (
              <section key={group.scope} className="filter-group">
                <button
                  type="button"
                  className="filter-group-head"
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() => toggleGroup(group.scope)}
                >
                  <span>{tr().products.scopes[group.label]}</span>
                  <span className="filter-group-count">{group.categories.length}</span>
                </button>
                {open && (
                  <div className="filter-group-body" id={listId}>
                    <ul className="filter-group-list">
                      {shown.map((category) => (
                        <li key={category.categoryId}>
                          <button
                            type="button"
                            className="filter-option"
                            aria-pressed={categoryId === category.categoryId}
                            onClick={() => {
                              applyFilters({
                                categoryId: category.categoryId,
                                page: 1,
                              });
                              setShowFilters(false);
                            }}
                          >
                            {category.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {group.categories.length > GROUP_PREVIEW && (expanded || rest > 0) && (
                      <button
                        type="button"
                        className="link-button filter-more"
                        onClick={() => toggleExpanded(group.scope)}
                      >
                        {expanded ? tr().products.showLess : tr().products.more(rest)}
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </aside>

        <div className="catalog-results" aria-busy={loading}>
          <div className="results-head">
            <p className="results-count">
              {firstLoad ? tr().lists2.searching : tr().products.count(count.format(total), total)}
            </p>
            {selectedCategory && (
              <button
                type="button"
                className="active-filter"
                aria-label={tr().products.removeFilter(selectedCategory.name)}
                onClick={() => applyFilters({ categoryId: null, page: 1 })}
              >
                {selectedCategory.name}
                <span className="active-filter-x" aria-hidden="true" />
              </button>
            )}
            {!groceryOnly && <span className="pill pill-muted">{tr().products.includesNonGrocery}</span>}
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="link-button results-clear"
                onClick={() => applyFilters({ categoryId: null, groceryOnly: true, page: 1 })}
              >
                {tr().products.clearFilters}
              </button>
            )}
          </div>

          {!loading && products.length === 0 ? (
            <p className="empty-state">
              {search || categoryId ? tr().products.noneForFilters : tr().products.noneInCatalog}
            </p>
          ) : (
            products.length > 0 && (
              <div className={`price-rows${loading ? " is-loading" : ""}`}>
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

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(nextPage) => applyFilters({ page: nextPage })}
          />
        </div>
      </div>
    </div>
  );
}

/** O produto com a oferta mais barata que a Api conhece (GET /products não traz preços). */
function ProductLabel({ product, top }: { product: ProductDto; index: number; top: CategoryDto | null }) {
  const offers = useOffers(product.productId);
  const aisleName = (top ?? product.category).name;
  const priced = offers ? sortOffers(offers).filter(isOnSale) : [];
  const cheapest = priced[0];
  const unit = cheapest ? unitPriceLabel(cheapest) : null;

  let band;
  if (product.status === ProductStatus.Discontinued) band = <VerdictBand tone="none">{tr().products.discontinued}</VerdictBand>;
  else if (offers === undefined) band = <VerdictBand tone="none">{tr().products.readingHistory}</VerdictBand>;
  else if (cheapest) band = <VerdictBand insight={cheapest.priceInsight} />;
  else band = <VerdictBand tone="none">{tr().ui.price.noPrice}</VerdictBand>;

  return (
    <ShelfLabel
      to={`/produtos/${product.productId}`}
      band={band}
      className="product-row"
      media={product.imageUrl ? <ProductThumb src={product.imageUrl} /> : undefined}
    >
      <div className="label-name">{product.name}</div>
      <div className="label-meta">
        {product.brand ?? tr().products.noBrand} · {formatPackage(product.packageQuantity, product.packageUnit)} ·{" "}
        {aisleName}
      </div>
      {(offers === undefined || cheapest) && (
        <div className="label-price-line">
          <LabelPrice
            amount={offers === undefined ? undefined : cheapest?.latestPrice?.price.amount}
            from={priced.length > 1}
          />
          {cheapest && (
            <span className="label-unit">
              {unit && <strong>{unit}</strong>}
              {unit && " · "}
              {cheapest.chainName}
              {priced.length > 1 && tr().products.stores(priced.length)}
              {cheapest.cardPrice && ` · ${money.format(cheapest.cardPrice.amount)} ${tr().ui.price.withCard}`}
            </span>
          )}
        </div>
      )}
      <span className="arrow-link">{tr().products.seeDetail}</span>
    </ShelfLabel>
  );
}
