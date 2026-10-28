import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, getChains, searchCurrentPromotions } from "../api/client";
import { CategoryScope, ChainStatus, type CategoryDto, type ChainDto, type CurrentPromotionDto } from "../api/types";
import { GroceryOnlyToggle } from "../components/GroceryOnlyToggle";
import { Pagination } from "../components/Pagination";
import { PromotionOfferLabel } from "../components/PromotionOfferLabel";

const count = new Intl.NumberFormat("pt-PT");
const PAGE_SIZE = 20;
// Em produção há 4 cadeias abertas; acima disto os chips deixam de caber
// numa linha e passa a ser uma lista.
const MAX_CHAIN_CHIPS = 8;

export function PromotionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const chainId = searchParams.get("chainId");
  const categoryId = searchParams.get("categoryId");
  // Ligado por omissão, como em Produtos; `grocery=0` mostra tudo.
  const groceryOnly = searchParams.get("grocery") !== "0";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [chains, setChains] = useState<ChainDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [offers, setOffers] = useState<CurrentPromotionDto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function applyFilters(next: { chainId?: string | null; categoryId?: string | null; groceryOnly?: boolean; page?: number }) {
    const nextChainId = next.chainId === undefined ? chainId : next.chainId;
    const nextCategoryId = next.categoryId === undefined ? categoryId : next.categoryId;
    const nextGroceryOnly = next.groceryOnly ?? groceryOnly;
    const nextPage = next.page ?? page;

    const params = new URLSearchParams();
    if (nextChainId) params.set("chainId", nextChainId);
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (!nextGroceryOnly) params.set("grocery", "0");
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
    () => chains.filter((chain) => chain.status === ChainStatus.Active).sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [chains],
  );

  useEffect(() => {
    setLoading(true);
    searchCurrentPromotions(chainId ?? undefined, page, PAGE_SIZE, categoryId ?? undefined, groceryOnly)
      .then((result) => {
        setOffers(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [chainId, categoryId, groceryOnly, page]);

  return (
    <div className="page">
      <h1>Promoções ativas</h1>
      <p className="page-sub">Produtos em promoção na última leitura de cada loja, dos últimos 3 dias.</p>

      <div className="toolbar">
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
        <GroceryOnlyToggle value={groceryOnly} onChange={(value) => applyFilters({ groceryOnly: value, page: 1 })} />
        {openChains.length > MAX_CHAIN_CHIPS && (
          <select
            className="category-select"
            aria-label="Cadeia"
            value={chainId ?? ""}
            onChange={(e) => applyFilters({ chainId: e.target.value || null, page: 1 })}
          >
            <option value="">Todas as cadeias</option>
            {openChains.map((chain) => (
              <option key={chain.chainId} value={chain.chainId}>
                {chain.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {openChains.length > 1 && openChains.length <= MAX_CHAIN_CHIPS && (
        <div className="chip-row" role="group" aria-label="Cadeia">
          <button type="button" className="chip" aria-pressed={chainId === null} onClick={() => applyFilters({ chainId: null, page: 1 })}>
            Todas
          </button>
          {openChains.map((chain) => (
            <button
              key={chain.chainId}
              type="button"
              className="chip"
              aria-pressed={chainId === chain.chainId}
              onClick={() => applyFilters({ chainId: chainId === chain.chainId ? null : chain.chainId, page: 1 })}
            >
              {chain.name}
            </button>
          ))}
        </div>
      )}

      <p className="results-count">
        {loading || total === null ? "A procurar…" : `${count.format(total)} ${total === 1 ? "produto" : "produtos"} em promoção`}
      </p>

      {!loading && offers.length === 0 ? (
        <p className="empty-state">Sem promoções ativas neste momento.</p>
      ) : (
        !loading && (
          <div className="label-grid">
            {offers.map((offer, index) => (
              <PromotionOfferLabel key={offer.storeOfferId} offer={offer} index={index} />
            ))}
          </div>
        )
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total ?? 0} onPageChange={(nextPage) => applyFilters({ page: nextPage })} />
    </div>
  );
}
