import { Busy } from "../components/Busy";
import { useEffect, useMemo, useState } from "react";
import { useLoad } from "../useLoad";
import { useSearchParams } from "react-router-dom";
import { CardsSkeleton } from "../components/CardsSkeleton";
import { getCategories, getChains, searchCurrentPromotions } from "../api/client";
import { CategoryScope, ChainStatus, type CategoryDto, type ChainDto, type CurrentPromotionDto } from "../api/types";
import { GroceryOnlyToggle } from "../components/GroceryOnlyToggle";
import { Pagination } from "../components/Pagination";
import { PromotionOfferLabel } from "../components/PromotionOfferLabel";
import { usePageSize } from "../usePageSize";
import { numberFormat } from "../i18n/format";
import { tr } from "../i18n";

const count = numberFormat();
// Em produção há 4 cadeias abertas; acima disto os chips deixam de caber
// numa linha e passa a ser uma lista.
const MAX_CHAIN_CHIPS = 8;
const MIN_DISCOUNTS = [20, 30, 50];

// `card=1` só com cartão, `card=0` só sem cartão; outro valor, todas.
function parseCard(value: string | null): boolean | undefined {
  if (value === "1") return true;
  if (value === "0") return false;
  return undefined;
}

function parseMinDiscount(value: string | null): number | undefined {
  const parsed = Number(value);
  return MIN_DISCOUNTS.includes(parsed) ? parsed : undefined;
}

export function PromotionsPage() {
  const pageSize = usePageSize(20, 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const chainId = searchParams.get("chainId");
  const categoryId = searchParams.get("categoryId");
  // Ligado por omissão, como em Produtos; `grocery=0` mostra tudo.
  const groceryOnly = searchParams.get("grocery") !== "0";
  const requiresCard = parseCard(searchParams.get("card"));
  const minDiscount = parseMinDiscount(searchParams.get("discount"));
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [chains, setChains] = useState<ChainDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  // Fechados por omissão: os quatro filtros juntos ocupavam meio ecrã no
  // telemóvel. As cadeias ficam sempre à vista.
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    (categoryId ? 1 : 0) +
    (requiresCard !== undefined ? 1 : 0) +
    (minDiscount !== undefined ? 1 : 0) +
    (groceryOnly ? 0 : 1);

  function applyFilters(next: {
    chainId?: string | null;
    categoryId?: string | null;
    groceryOnly?: boolean;
    requiresCard?: boolean | null;
    minDiscount?: number | null;
    page?: number;
  }) {
    const nextChainId = next.chainId === undefined ? chainId : next.chainId;
    const nextCategoryId = next.categoryId === undefined ? categoryId : next.categoryId;
    const nextGroceryOnly = next.groceryOnly ?? groceryOnly;
    const nextRequiresCard = next.requiresCard === undefined ? requiresCard : next.requiresCard;
    const nextMinDiscount = next.minDiscount === undefined ? minDiscount : next.minDiscount;
    const nextPage = next.page ?? page;

    const params = new URLSearchParams();
    if (nextChainId) params.set("chainId", nextChainId);
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (!nextGroceryOnly) params.set("grocery", "0");
    if (nextRequiresCard != null) params.set("card", nextRequiresCard ? "1" : "0");
    if (nextMinDiscount != null) params.set("discount", String(nextMinDiscount));
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    getChains().then(setChains);
    getCategories(true).then(setCategories);
  }, []);

  // Só as categorias de topo, como em Produtos: a Api inclui as
  // subcategorias de cada uma.
  const topLevelCategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentCategoryId === null)
        .filter((category) => !groceryOnly || category.scope !== CategoryScope.NonGrocery)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [categories, groceryOnly],
  );

  // GET /chains traz também as cadeias de teste fechadas; só as abertas
  // têm lojas com preços.
  const openChains = useMemo(
    () =>
      chains.filter((chain) => chain.status === ChainStatus.Active).sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [chains],
  );

  // A grelha anterior fica à vista enquanto a nova carrega.
  const found = useLoad(
    [chainId, categoryId, groceryOnly, requiresCard, minDiscount, page, pageSize],
    () =>
      searchCurrentPromotions(chainId ?? undefined, page, pageSize, categoryId ?? undefined, groceryOnly, requiresCard, minDiscount),
    { keepPrevious: true },
  );
  const offers: CurrentPromotionDto[] = found.data?.items ?? [];
  const total: number | null = found.data?.total ?? null;
  const loading = found.loading;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{tr().promotions.title}</h1>
          <p className="page-head-sub">{tr().promotions.subtitle}</p>
        </div>
      </header>

      <div className="chip-row">
        <button
          type="button"
          className="chip chip-more"
          aria-expanded={showFilters}
          aria-controls="promotion-filters"
          onClick={() => setShowFilters((open) => !open)}
        >
          {activeFilterCount > 0 ? tr().promotions.filtersCount(activeFilterCount) : tr().promotions.filters}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="chip"
            onClick={() =>
              applyFilters({
                categoryId: null,
                requiresCard: null,
                minDiscount: null,
                groceryOnly: true,
                page: 1,
              })
            }
          >
            {tr().promotions.clear}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="toolbar" id="promotion-filters">
          <select
            className="category-select"
            aria-label={tr().lists2.category}
            value={categoryId ?? ""}
            onChange={(e) => applyFilters({ categoryId: e.target.value || null, page: 1 })}
          >
            <option value="">{tr().lists2.allCategories}</option>
            {topLevelCategories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="category-select"
            aria-label={tr().promotions.card}
            value={requiresCard === undefined ? "" : requiresCard ? "1" : "0"}
            onChange={(e) =>
              applyFilters({
                requiresCard: parseCard(e.target.value) ?? null,
                page: 1,
              })
            }
          >
            <option value="">{tr().promotions.anyCard}</option>
            <option value="1">{tr().promotions.cardOnly}</option>
            <option value="0">{tr().promotions.noCard}</option>
          </select>
          <select
            className="category-select"
            aria-label={tr().promotions.minDiscount}
            value={minDiscount ?? ""}
            onChange={(e) =>
              applyFilters({
                minDiscount: parseMinDiscount(e.target.value) ?? null,
                page: 1,
              })
            }
          >
            <option value="">{tr().promotions.anyDiscount}</option>
            {MIN_DISCOUNTS.map((value) => (
              <option key={value} value={value}>
                {tr().promotions.orMore(value)}
              </option>
            ))}
          </select>
          <GroceryOnlyToggle value={groceryOnly} onChange={(value) => applyFilters({ groceryOnly: value, page: 1 })} />
          {openChains.length > MAX_CHAIN_CHIPS && (
            <select
              className="category-select"
              aria-label={tr().stores.chain}
              value={chainId ?? ""}
              onChange={(e) => applyFilters({ chainId: e.target.value || null, page: 1 })}
            >
              <option value="">{tr().stores.allChains}</option>
              {openChains.map((chain) => (
                <option key={chain.chainId} value={chain.chainId}>
                  {chain.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {openChains.length > 1 && openChains.length <= MAX_CHAIN_CHIPS && (
        <div className="chip-row" role="group" aria-label={tr().stores.chain}>
          <button
            type="button"
            className="chip"
            aria-pressed={chainId === null}
            onClick={() => applyFilters({ chainId: null, page: 1 })}
          >
            {tr().lists2.all}
          </button>
          {openChains.map((chain) => (
            <button
              key={chain.chainId}
              type="button"
              className="chip"
              aria-pressed={chainId === chain.chainId}
              onClick={() =>
                applyFilters({
                  chainId: chainId === chain.chainId ? null : chain.chainId,
                  page: 1,
                })
              }
            >
              {chain.name}
            </button>
          ))}
        </div>
      )}

      <p className="results-count">
        {loading || total === null
          ? <Busy>{tr().lists2.searching}</Busy>
          : tr().promotions.count(count.format(total), total)}
      </p>

      {loading && <CardsSkeleton count={8} />}
      {!loading && offers.length === 0 ? (
        <p className="empty-state">{tr().promotions.none}</p>
      ) : (
        !loading && (
          <div className="price-rows">
            {offers.map((offer) => (
              <PromotionOfferLabel key={offer.storeOfferId} offer={offer} />
            ))}
          </div>
        )
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total ?? 0}
        onPageChange={(nextPage) => applyFilters({ page: nextPage })}
      />
    </div>
  );
}
