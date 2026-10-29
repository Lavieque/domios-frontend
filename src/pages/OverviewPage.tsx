import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchActivePromotions, searchProducts, searchRecipes } from "../api/client";
import type { CallerHouseholdDto } from "../api/households";
import { listPantryItems, type PantryItemDto } from "../api/pantry";
import { listPlannedMeals, mealTypeLabels, PlannedMealStatus, type PlannedMealDto } from "../api/planning";
import { measurementUnitLabels, type PromotionDto } from "../api/types";
import { PromotionLabel } from "../components/PromotionLabel";
import { HouseholdGate } from "../household/HouseholdGate";
import { OpportunitiesPanel } from "../opportunities/OpportunitiesPanel";
import { useProducts } from "../pantry/useProducts";
import { addDays, daysBetween, longDate, shortDate, today, weekdayTitle } from "../plan/dates";
import { useOpenLists } from "../shopping/useOpenLists";

const count = new Intl.NumberFormat("pt-PT");
const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

export function OverviewPage() {
  const [productsTotal, setProductsTotal] = useState<number | null>(null);
  const [promotionsTotal, setPromotionsTotal] = useState<number | null>(null);
  const [recipesTotal, setRecipesTotal] = useState<number | null>(null);
  const [soonPromotions, setSoonPromotions] = useState<PromotionDto[] | null>(null);

  useEffect(() => {
    searchProducts("", 1, 1).then((result) => setProductsTotal(result.total));
    searchRecipes("", 1, 1).then((result) => setRecipesTotal(result.total));
    searchActivePromotions(1, 100).then((result) => {
      setPromotionsTotal(result.total);
      setSoonPromotions(
        [...result.items].sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()).slice(0, 4),
      );
    });
  }, []);

  const day = today();

  return (
    <div className="page">
      <h1>
        {weekdayTitle(day)}, {longDate(day)}
      </h1>
      <p className="catalog-line">
        <Link to="/produtos">
          <strong>{productsTotal === null ? "…" : count.format(productsTotal)}</strong> produtos
        </Link>
        <Link to="/promocoes">
          <strong>{promotionsTotal === null ? "…" : count.format(promotionsTotal)}</strong> promoções ativas
        </Link>
        <Link to="/receitas">
          <strong>{recipesTotal === null ? "…" : count.format(recipesTotal)}</strong> receitas
        </Link>
      </p>

      <div className="overview-grid">
        <div>
          <HouseholdGate
            withoutHousehold={
              <section className="panel">
                <h2>A tua casa</h2>
                <p className="muted">
                  Plano, despensa e listas pertencem a uma casa. <Link to="/casa/nova">Cria a tua casa</Link> para os
                  usar.
                </p>
              </section>
            }
          >
            {(household) => <HouseholdToday household={household} />}
          </HouseholdGate>
        </div>

        <section>
          <div className="section-head">
            <h2>A terminar</h2>
            <Link to="/promocoes">Todas as promoções</Link>
          </div>
          {soonPromotions === null && <p className="muted loading">A carregar…</p>}
          {soonPromotions !== null && soonPromotions.length === 0 && (
            <p className="empty-state">Sem promoções ativas neste momento.</p>
          )}
          {soonPromotions !== null && soonPromotions.length > 0 && (
            <div className="label-grid">
              {soonPromotions.map((promo, index) => (
                <PromotionLabel key={promo.promotionId} promotion={promo} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function HouseholdToday({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const day = today();
  const [meals, setMeals] = useState<PlannedMealDto[] | null>(null);
  const [pantry, setPantry] = useState<PantryItemDto[] | null>(null);
  const { lists } = useOpenLists(householdId);
  const products = useProducts(pantry?.map((item) => item.productId) ?? []);

  useEffect(() => {
    let cancelled = false;
    listPlannedMeals(householdId, day, addDays(day, 6))
      .then((result) => !cancelled && setMeals(result.filter((m) => m.status !== PlannedMealStatus.Skipped)))
      .catch(() => !cancelled && setMeals([]));
    listPantryItems(householdId, { sort: "fifo", pageSize: 6 })
      .then((result) => !cancelled && setPantry(result.items))
      .catch(() => !cancelled && setPantry([]));
    return () => {
      cancelled = true;
    };
  }, [householdId, day]);

  return (
    <>
      <OpportunitiesPanel householdId={householdId} />

      <section className="panel">
        <div className="section-head">
          <h2>Próximos dias</h2>
          <Link to="/plano">Plano da semana</Link>
        </div>
        {meals === null && <p className="muted loading">A carregar…</p>}
        {meals !== null && meals.length === 0 && (
          <p className="muted">
            Nada planeado para os próximos 7 dias. <Link to="/ementas">Aplicar uma ementa pronta</Link> ou{" "}
            <Link to="/receitas">escolher receitas</Link>.
          </p>
        )}
        {meals !== null && meals.length > 0 && (
          <ul className="today-list">
            {meals.slice(0, 7).map((meal) => (
              <li key={meal.plannedMealId}>
                <span className="meal-meta muted">
                  {meal.date === day ? "Hoje" : weekdayTitle(meal.date)} · {mealTypeLabels[meal.mealType]}
                </span>
                {meal.recipeId ? (
                  <Link to={`/receitas/${meal.recipeId}`} className="meal-title">
                    {meal.title}
                  </Link>
                ) : (
                  <span className="meal-title">{meal.title}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Usar primeiro</h2>
          <Link to="/despensa">Despensa</Link>
        </div>
        {pantry === null && <p className="muted loading">A carregar…</p>}
        {pantry !== null && pantry.length === 0 && (
          <p className="muted">
            A despensa está vazia. <Link to="/despensa/adicionar">Adicionar o primeiro produto</Link>
          </p>
        )}
        {pantry !== null && pantry.length > 0 && (
          <ul className="today-list">
            {pantry.map((item) => (
              <li key={item.pantryItemId}>
                <ExpiryTag expiresAt={item.expiresAt} opened={item.openedAt !== null} />
                <span>
                  <Link to={`/produtos/${item.productId}`} className="meal-title">
                    {products.get(item.productId)?.name ?? "…"}
                  </Link>{" "}
                  <span className="meal-meta muted">
                    {quantityFormat.format(item.quantity.amount)} {measurementUnitLabels[item.quantity.unit]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Listas abertas</h2>
          <Link to="/listas">Todas as listas</Link>
        </div>
        {lists === null && <p className="muted loading">A carregar…</p>}
        {lists !== null && lists.length === 0 && <p className="muted">Sem listas abertas.</p>}
        {lists !== null && lists.length > 0 && (
          <ul className="today-list">
            {lists.map((list) => (
              <li key={list.shoppingListId}>
                <span className="meal-meta muted">
                  {list.itemCount === 0 ? "Vazia" : `${list.itemCount - list.purchasedItemCount} por comprar`}
                </span>
                <Link to={`/listas/${list.shoppingListId}`} className="meal-title">
                  {list.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ExpiryTag({ expiresAt, opened }: { expiresAt: string | null; opened: boolean }) {
  if (!expiresAt) return <span className="meal-meta muted">{opened ? "Aberto" : "Sem validade"}</span>;
  const days = daysBetween(today(), expiresAt);
  if (days < 0) return <span className="pill pill-danger">Expirou</span>;
  if (days === 0) return <span className="pill pill-danger">Expira hoje</span>;
  if (days <= 3) return <span className="pill pill-warning">{days === 1 ? "Amanhã" : `Em ${days} dias`}</span>;
  return <span className="meal-meta muted">Até {shortDate(expiresAt)}</span>;
}
