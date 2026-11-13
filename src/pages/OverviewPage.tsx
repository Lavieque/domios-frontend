import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHousehold, type CallerHouseholdDto } from "../api/households";
import { listPantryItems, type PantryItemDto } from "../api/pantry";
import { listPlannedMeals, MealType, mealTypeLabels, PlannedMealStatus, type PlannedMealDto } from "../api/planning";
import { getCookableRecipes, type CookableRecipesDto } from "../api/savedRecipes";
import { measurementUnitLabels } from "../api/types";
import { HouseholdGate } from "../household/HouseholdGate";
import { OpportunitiesPanel } from "../opportunities/OpportunitiesPanel";
import { urgency } from "../pantry/urgency";
import { useProducts } from "../pantry/useProducts";
import { addDays, startOfWeek, today, weekdayTitle, type IsoDate } from "../plan/dates";
import { useRecipeImages } from "../plan/recipeImages";
import { useOpenLists } from "../shopping/useOpenLists";

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
const longDate = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Ordem das refeições num dia, da primeira à última. */
const slotOrder: MealType[] = [MealType.Breakfast, MealType.Lunch, MealType.Snack, MealType.Dinner, MealType.Other];

/** O dia de hoje, que muda à meia-noite mesmo com a app aberta. */
function useToday(): IsoDate {
  const [day, setDay] = useState(today());
  useEffect(() => {
    const id = window.setInterval(() => setDay(today()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return day;
}

export function OverviewPage() {
  return (
    <div className="page today-page">
      <HouseholdGate
        withoutHousehold={
          <>
            <TodayIntro title="Olá!" />
            <section className="panel">
              <h2>Ainda não tens casa</h2>
              <p className="muted">
                O dia, a semana, a despensa e as compras pertencem a uma casa. Cria a tua e começa pelo jantar de hoje.
              </p>
              <div className="panel-actions">
                <Link to="/casa/nova" className="button-primary">
                  Criar a casa
                </Link>
              </div>
            </section>
          </>
        }
      >
        {(household) => <HouseholdToday household={household} />}
      </HouseholdGate>
    </div>
  );
}

function TodayIntro({ title }: { title: string }) {
  const day = useToday();
  return (
    <header className="page-head today-intro">
      <div>
        <p className="eyebrow">{longDate.format(new Date(`${day}T12:00:00Z`))}</p>
        <h1>{title}</h1>
        <p className="page-head-sub">
          Uma casa mais organizada,
          <br />
          uma vida mais simples.
        </p>
      </div>
    </header>
  );
}

function HouseholdToday({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const day = useToday();
  const weekStart = startOfWeek(day);
  const [meals, setMeals] = useState<PlannedMealDto[] | null>(null);
  const [cookable, setCookable] = useState<CookableRecipesDto | null>(null);
  const [pantry, setPantry] = useState<PantryItemDto[] | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const { lists } = useOpenLists(householdId);
  const products = useProducts(pantry?.map((item) => item.productId) ?? []);

  useEffect(() => {
    let cancelled = false;
    listPlannedMeals(householdId, weekStart, addDays(weekStart, 6))
      .then((result) => !cancelled && setMeals(result.filter((m) => m.status === PlannedMealStatus.Planned)))
      .catch(() => !cancelled && setMeals([]));
    getCookableRecipes(householdId, 6)
      .then((result) => !cancelled && setCookable(result))
      .catch(() => !cancelled && setCookable({ saved: [], others: [] }));
    listPantryItems(householdId, { sort: "expiry", pageSize: 6 })
      .then((result) => !cancelled && setPantry(result.items))
      .catch(() => !cancelled && setPantry([]));
    getHousehold(householdId)
      .then((result) => {
        if (!cancelled) setMemberName(result.members.find((m) => m.memberId === household.memberId)?.name ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [householdId, household.memberId, weekStart]);

  const allCookable = cookable ? [...cookable.saved, ...cookable.others] : [];
  // À mesa esta semana: de hoje em diante, por dia e pela ordem das refeições.
  const upcoming = (meals ?? [])
    .filter((m) => m.date >= day)
    .sort((a, b) => a.date.localeCompare(b.date) || slotOrder.indexOf(a.mealType) - slotOrder.indexOf(b.mealType))
    .slice(0, 3);

  // A foto de cada prato vem da receita (as que dá para fazer já a trazem).
  const images = useRecipeImages(
    upcoming.map((m) => (m.recipeId && !allCookable.some((r) => r.recipeId === m.recipeId) ? m.recipeId : null)),
  );

  const toBuy = lists ? lists.reduce((sum, list) => sum + (list.itemCount - list.purchasedItemCount), 0) : null;
  const useSoon = pantry ? pantry.filter((item) => urgency(item.expiresAt).level >= 2).length : null;
  const firstList = lists?.[0] ?? null;
  const firstLeft = firstList ? firstList.itemCount - firstList.purchasedItemCount : 0;

  return (
    <>
      <TodayIntro title={memberName ? `Olá, ${memberName}!` : "Olá!"} />

      <div className="stats">
        <Stat to="/plano" value={meals?.length ?? null} label="refeições planeadas" icon="M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18" />
        <Stat to="/listas" value={toBuy} label="artigos por comprar" icon="M2 3h3l3 12h11l2-8H6 M9 20h.01m9 0h.01" />
        <Stat to="/despensa" value={useSoon} label="alimentos a usar" icon="M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
      </div>

      <div className="home-grid home-grid-top">
        <section className="panel edge-photo edge-soft edge-plan">
          <div className="section-head">
            <h2>À mesa esta semana</h2>
            <Link to="/plano" className="arrow-link">
              Ver planeamento →
            </Link>
          </div>
          {meals === null && <p className="muted loading">A carregar…</p>}
          {meals !== null && upcoming.length === 0 && (
            <p className="muted">
              Escolhe a primeira refeição no <Link to="/plano">planeamento</Link>.
            </p>
          )}
          {upcoming.length > 0 && (
            <div className="photo-cards">
              {upcoming.map((meal) => {
                const recipe = meal.recipeId ? (allCookable.find((r) => r.recipeId === meal.recipeId) ?? null) : null;
                const image = recipe?.imageUrl ?? (meal.recipeId ? (images.get(meal.recipeId) ?? null) : null);
                const body = (
                  <>
                    <span className="photo-card-media">
                      {/* Sem foto, ou se não carregar, fica o desenho de fundo do cartão. */}
                      {image && <img src={image} alt="" loading="lazy" onError={(e) => (e.currentTarget.hidden = true)} />}
                    </span>
                    <span className="photo-card-body">
                      <span className="photo-card-title">{meal.title}</span>
                      <span className="photo-card-meta">
                        {weekdayTitle(meal.date).replace("-feira", "")} · {mealTypeLabels[meal.mealType]}
                        {recipe && (
                          <>
                            <br />
                            {recipe.availableCount} de {recipe.requiredCount} ingredientes em casa
                          </>
                        )}
                      </span>
                    </span>
                  </>
                );
                return meal.recipeId ? (
                  <Link key={meal.plannedMealId} to={`/receitas/${meal.recipeId}`} className="photo-card">
                    {body}
                  </Link>
                ) : (
                  <div key={meal.plannedMealId} className="photo-card">
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel edge-photo edge-soft edge-pantry use-first-panel">
          <div className="section-head">
            <h2>Usar primeiro</h2>
          </div>
          {pantry === null && <p className="muted loading">A carregar…</p>}
          {pantry !== null && pantry.length === 0 && (
            <p className="muted">
              A despensa está vazia. <Link to="/despensa/adicionar">Guardar as compras</Link>
            </p>
          )}
          {pantry !== null &&
            pantry.slice(0, 3).map((item) => {
              const u = urgency(item.expiresAt);
              const product = products.get(item.productId);
              return (
                <Link key={item.pantryItemId} to={`/produtos/${item.productId}`} className="use-row">
                  <span className="use-row-thumb">
                    {product?.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" />}
                  </span>
                  <span className="use-row-text">
                    <strong>{product?.name ?? "…"}</strong>
                    <span>
                      {quantityFormat.format(item.quantity.amount)} {measurementUnitLabels[item.quantity.unit]}
                      {item.openedAt !== null && " · aberto"}
                    </span>
                  </span>
                  <span className={u.level >= 2 ? "badge badge-warn" : "badge"}>{u.label}</span>
                </Link>
              );
            })}
          <Link to="/despensa" className="arrow-link">
            Ver despensa →
          </Link>
        </section>
      </div>

      <div className="home-grid home-grid-bottom">
        <section className="panel edge-photo edge-shopping shop-banner">
          <div>
            <p className="eyebrow">Compras com intenção</p>
            <h2>
              Comprar melhor
              <br />
              começa aqui.
            </h2>
            <p className="muted">
              {lists === null
                ? "A carregar…"
                : firstList
                  ? `${firstLeft} ${firstLeft === 1 ? "artigo" : "artigos"} na lista «${firstList.name}».`
                  : "Ainda não tens listas abertas."}
            </p>
          </div>
          <Link to={firstList ? `/listas/${firstList.shoppingListId}` : "/listas"} className="button-sage">
            {firstList ? "Abrir lista →" : "Criar lista →"}
          </Link>
        </section>

        <section className="panel edge-photo edge-offers">
          <h2>Oportunidades para ti</h2>
          <p className="muted">Descobre os preços nas tuas lojas e compara os artigos de que precisas.</p>
          <Link to="/produtos" className="arrow-link">
            Comparar preços →
          </Link>
        </section>
      </div>

      <OpportunitiesPanel householdId={householdId} />
    </>
  );
}

function Stat({ to, value, label, icon }: { to: string; value: number | null; label: string; icon: string }) {
  return (
    <Link to={to} className="stat">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={icon} />
      </svg>
      <span>
        <b>{value ?? "…"}</b>
        <small>{label}</small>
      </span>
    </Link>
  );
}
