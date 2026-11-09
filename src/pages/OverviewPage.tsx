import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { describeError } from "../auth/errors";
import type { CallerHouseholdDto } from "../api/households";
import { listPantryItems, type PantryItemDto } from "../api/pantry";
import { getRecipe } from "../api/client";
import {
  AvailabilityLineStatus,
  getPlanAvailability,
  listPlannedMeals,
  MealType,
  mealTypeLabels,
  PlannedMealStatus,
  type PlanAvailabilityDto,
  type PlannedMealDto,
} from "../api/planning";
import { getCookableRecipes, RecipeVerdict, type CookableRecipeDto, type CookableRecipesDto } from "../api/savedRecipes";
import {
  addPlanToShoppingList,
  getStoreComparison,
  type ShoppingListSummaryDto,
  type StoreComparisonDto,
} from "../api/shopping";
import { measurementUnitLabels } from "../api/types";
import { money } from "../catalog/offers";
import { HouseholdGate } from "../household/HouseholdGate";
import { OpportunitiesPanel } from "../opportunities/OpportunitiesPanel";
import { urgency } from "../pantry/urgency";
import { useProducts } from "../pantry/useProducts";
import { addDays, today, weekdayTitle, type IsoDate } from "../plan/dates";
import { useOpenLists } from "../shopping/useOpenLists";

const quantityFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });
const monthFormat = new Intl.DateTimeFormat("pt-PT", { month: "long", timeZone: "UTC" });
const listFormat = new Intl.ListFormat("pt-PT", { type: "conjunction" });
const LAST_SHEET_KEY = "domios.lastSheet";

/** Ordem de interesse para "o que se come hoje": o jantar primeiro, depois o almoço. */
const slotPriority: MealType[] = [MealType.Dinner, MealType.Lunch, MealType.Other, MealType.Snack, MealType.Breakfast];

function dayNumber(date: IsoDate): number {
  return Number(date.slice(8, 10));
}

function monthName(date: IsoDate): string {
  return monthFormat.format(new Date(`${date}T00:00:00Z`));
}

function isSunday(date: IsoDate): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

/** Estação do ano no hemisfério norte, pelas datas habituais dos equinócios e solstícios. */
function seasonOf(date: IsoDate): string {
  const md = Number(date.slice(5, 7)) * 100 + Number(date.slice(8, 10));
  if (md >= 321 && md < 621) return "Primavera";
  if (md >= 621 && md < 923) return "Verão";
  if (md >= 923 && md < 1221) return "Outono";
  return "Inverno";
}

// O que está na época em Portugal, mês a mês, como no almanaque.
const produceByMonth = [
  "laranja, couve, nabiças, grelos",
  "laranja, couve-flor, grelos, alho-francês",
  "espinafres, ervilhas, favas, nêsperas",
  "favas, ervilhas, espargos, alface",
  "morangos, cerejas, alface, favas",
  "cerejas, pêssegos, tomate, courgette",
  "tomate, pimento, melão, pêssegos",
  "figos, melão, uvas, tomate",
  "uvas, figos, abóbora, maçã",
  "maçã, castanhas, abóbora, romã",
  "castanhas, couve, laranja, tangerina",
  "laranja, tangerina, couve, nabos",
];

// Nascer e pôr do sol em Lisboa (aproximação de almanaque, ao minuto).
function sunTimes(date: IsoDate): { rise: string; set: string } {
  const lat = (38.72 * Math.PI) / 180;
  const lon = -9.14;
  const d = new Date(`${date}T12:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const n = Math.floor((d.getTime() - start) / 86400000);
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g);
  const ha = Math.acos(
    Math.cos((90.833 * Math.PI) / 180) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl),
  );
  const noon = 720 - 4 * lon - eqTime;
  const span = (4 * ha * 180) / Math.PI;
  const fmt = (minutesUtc: number) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + Math.round(minutesUtc) * 60000).toLocaleTimeString(
      "pt-PT",
      { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" },
    );
  return { rise: fmt(noon - span), set: fmt(noon + span) };
}

function pickMainMeal(meals: PlannedMealDto[]): PlannedMealDto | null {
  for (const slot of slotPriority) {
    const meal = meals.find((m) => m.mealType === slot && m.status === PlannedMealStatus.Planned);
    if (meal) return meal;
  }
  return null;
}

/** O dia de hoje, que muda à meia-noite mesmo com a app aberta. */
function useToday(): IsoDate {
  const [day, setDay] = useState(today());
  useEffect(() => {
    const id = window.setInterval(() => setDay(today()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return day;
}

/**
 * A folha do dia anterior arranca-se uma vez: quando o dia mudou desde a última folha vista, com a app
 * aberta ou na primeira abertura do dia. Devolve o dia arrancado enquanto a animação corre.
 */
function useTornSheet(day: IsoDate): [IsoDate | null, () => void] {
  const [torn, setTorn] = useState<IsoDate | null>(null);
  useEffect(() => {
    let last: string | null = null;
    try {
      last = window.localStorage.getItem(LAST_SHEET_KEY);
      window.localStorage.setItem(LAST_SHEET_KEY, day);
    } catch {
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (last && last < day && !reduced) setTorn(last);
  }, [day]);
  return [torn, () => setTorn(null)];
}

export function OverviewPage() {
  return (
    <div className="page today-page">
      <HouseholdGate
        withoutHousehold={
          <section className="day-sheet day-sheet-empty">
            <DayColumn date={today()} />
            <div className="day-body">
              <h1 className="dish-name">Ainda não tens casa</h1>
              <p className="day-lede">
                O dia, a semana, a despensa e as compras pertencem a uma casa. Cria a tua e começa pelo jantar de hoje.
              </p>
              <div className="day-actions">
                <Link to="/casa/nova" className="button-primary button-lg">
                  Criar a casa
                </Link>
              </div>
            </div>
          </section>
        }
      >
        {(household) => <HouseholdToday household={household} />}
      </HouseholdGate>
    </div>
  );
}

function DayColumn({ date }: { date: IsoDate }) {
  const sun = sunTimes(date);
  return (
    <div className="day-column">
      <span className="day-weekday">{weekdayTitle(date)}</span>
      <span className={isSunday(date) ? "day-number day-sunday" : "day-number"} aria-hidden="true">
        {dayNumber(date)}
      </span>
      <span className="day-month">{monthName(date)}</span>
      <span className="day-season">
        <span className="day-season-name">{seasonOf(date)}</span>
        <span className="day-almanac">Da época: {produceByMonth[Number(date.slice(5, 7)) - 1]}.</span>
        <span className="day-almanac">
          Sol <span className="nowrap">{sun.rise}–{sun.set}</span>
        </span>
      </span>
      <span className="visually-hidden">
        {dayNumber(date)} de {monthName(date)}
      </span>
    </div>
  );
}

/** A folha do dia anterior, por cima da de hoje, a ser arrancada para cima. */
function TornSheet({ date, onDone }: { date: IsoDate; onDone: () => void }) {
  return (
    <div className="torn-sheet" aria-hidden="true" onAnimationEnd={onDone}>
      <DayColumn date={date} />
    </div>
  );
}

function HouseholdToday({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const day = useToday();
  const [torn, clearTorn] = useTornSheet(day);
  const [meals, setMeals] = useState<PlannedMealDto[] | null>(null);
  const [cookable, setCookable] = useState<CookableRecipesDto | null>(null);
  const [pantry, setPantry] = useState<PantryItemDto[] | null>(null);
  const [availability, setAvailability] = useState<Map<IsoDate, PlanAvailabilityDto> | null>(null);
  const [mainImage, setMainImage] = useState<{ recipeId: string; url: string | null } | null>(null);
  const { lists, reload: reloadLists } = useOpenLists(householdId);
  const products = useProducts(pantry?.map((item) => item.productId) ?? []);

  useEffect(() => {
    let cancelled = false;
    listPlannedMeals(householdId, day, addDays(day, 3))
      .then((result) => !cancelled && setMeals(result.filter((m) => m.status !== PlannedMealStatus.Skipped)))
      .catch(() => !cancelled && setMeals([]));
    getCookableRecipes(householdId, 6)
      .then((result) => !cancelled && setCookable(result))
      .catch(() => !cancelled && setCookable({ saved: [], others: [] }));
    // O que falta, dia a dia, vem do plano: não depende de a receita estar entre as que dá para fazer.
    Promise.all(
      [0, 1, 2, 3].map((offset) => {
        const date = addDays(day, offset);
        return getPlanAvailability(householdId, date, date)
          .then((result) => [date, result] as const)
          .catch(() => null);
      }),
    ).then((results) => {
      if (!cancelled) setAvailability(new Map(results.filter((r) => r !== null)));
    });
    listPantryItems(householdId, { sort: "expiry", pageSize: 6 })
      .then((result) => !cancelled && setPantry(result.items))
      .catch(() => !cancelled && setPantry([]));
    return () => {
      cancelled = true;
    };
  }, [householdId, day]);

  const todayMeals = meals?.filter((m) => m.date === day) ?? [];
  const mainMeal = meals ? pickMainMeal(todayMeals) : null;
  const allCookable = cookable ? [...cookable.saved, ...cookable.others] : [];
  const mainRecipe = mainMeal?.recipeId ? (allCookable.find((r) => r.recipeId === mainMeal.recipeId) ?? null) : null;
  const otherToday = todayMeals.filter((m) => m !== mainMeal);
  const missingOn = (date: IsoDate) => missingFrom(availability, date);

  // A foto do jantar vem da receita, mesmo quando ela não está entre as que dá para fazer.
  const needsImage = mainMeal?.recipeId && cookable !== null && !mainRecipe ? mainMeal.recipeId : null;
  useEffect(() => {
    if (!needsImage) return;
    let cancelled = false;
    getRecipe(needsImage)
      .then((recipe) => !cancelled && setMainImage({ recipeId: needsImage, url: recipe.imageUrl }))
      .catch(() => !cancelled && setMainImage({ recipeId: needsImage, url: null }));
    return () => {
      cancelled = true;
    };
  }, [needsImage]);
  const imageUrl =
    mainRecipe?.imageUrl ?? (mainImage && mainImage.recipeId === mainMeal?.recipeId ? mainImage.url : null);

  return (
    <div className="today-grid">
      <div className="today-main">
        <section className="day-sheet" aria-labelledby="day-dish">
          {torn && <TornSheet date={torn} onDone={clearTorn} />}
          <DayColumn date={day} />
          <div className="day-body">
            {meals === null ? (
              <p className="muted loading">A abrir a folha de hoje…</p>
            ) : mainMeal ? (
              <TonightMeal
                householdId={householdId}
                day={day}
                meal={mainMeal}
                recipe={mainRecipe}
                imageUrl={imageUrl}
                dayMissing={availability === null ? undefined : missingOn(day)}
                lists={lists}
                onListChanged={reloadLists}
              />
            ) : (
              <NothingPlanned cookable={cookable} />
            )}
            {otherToday.length > 0 && (
              <ul className="day-others">
                {otherToday.map((meal) => (
                  <li key={meal.plannedMealId}>
                    <span className="day-others-slot">{mealTypeLabels[meal.mealType]}</span>
                    {meal.recipeId ? <Link to={`/receitas/${meal.recipeId}`}>{meal.title}</Link> : meal.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <NextDays day={day} meals={meals} cookable={allCookable} missingOn={availability === null ? null : missingOn} />

        <div className="today-opportunities">
          <OpportunitiesPanel householdId={householdId} />
        </div>
      </div>

      <aside className="today-side">
        <UseFirst pantry={pantry} names={(id) => products.get(id)?.name ?? null} />
        <OpenLists householdId={householdId} lists={lists} />
      </aside>
    </div>
  );
}

function TonightMeal({
  householdId,
  day,
  meal,
  recipe,
  imageUrl,
  dayMissing,
  lists,
  onListChanged,
}: {
  householdId: string;
  day: IsoDate;
  meal: PlannedMealDto;
  recipe: CookableRecipeDto | null;
  imageUrl: string | null;
  /** O que falta para as refeições do dia: null quando não se sabe, undefined enquanto carrega. */
  dayMissing: string[] | null | undefined;
  lists: ShoppingListSummaryDto[] | null;
  onListChanged: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const missing = recipe ? recipe.missingIngredients.map((i) => i.name) : (dayMissing ?? []);
  const targetList = lists?.[0] ?? null;

  async function sendMissing() {
    if (!targetList) return;
    setSending(true);
    setError(null);
    try {
      const result = await addPlanToShoppingList(householdId, targetList.shoppingListId, day, day);
      setSent(
        result.addedItemCount === 0
          ? `A lista «${targetList.name}» já tinha tudo.`
          : `${result.addedItemCount} ${result.addedItemCount === 1 ? "item acrescentado" : "itens acrescentados"} a «${targetList.name}».`,
      );
      onListChanged();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h1 id="day-dish" className="dish-name">
        {meal.recipeId ? <Link to={`/receitas/${meal.recipeId}`}>{meal.title}</Link> : meal.title}
      </h1>
      <p className="dish-meta">
        {mealTypeLabels[meal.mealType]} para {meal.servings} {meal.servings === 1 ? "pessoa" : "pessoas"}
      </p>

      {imageUrl && (
        <figure className="dish-photo">
          <img src={imageUrl} alt="" />
        </figure>
      )}

      {recipe ? (
        <Readiness recipe={recipe} />
      ) : dayMissing === undefined ? (
        <p className="readiness readiness-unknown">A ver o que há em casa…</p>
      ) : dayMissing === null ? (
        <p className="readiness readiness-unknown">Não deu para ver se tens tudo em casa.</p>
      ) : (
        <DayReadiness missing={dayMissing} />
      )}

      <div className="day-actions">
        {meal.recipeId && (
          <Link to={`/receitas/${meal.recipeId}`} className="button-primary button-lg">
            Cozinhar
          </Link>
        )}
        {missing.length > 0 &&
          (targetList ? (
            <button type="button" className="button-secondary button-lg" onClick={sendMissing} disabled={sending}>
              {sending ? "A acrescentar…" : `Pôr o que falta em «${targetList.name}»`}
            </button>
          ) : (
            lists !== null && (
              <Link to="/listas" className="button-secondary button-lg">
                Criar uma lista para o que falta
              </Link>
            )
          ))}
      </div>
      {sent && (
        <p className="day-note" role="status">
          {sent}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function Readiness({ recipe }: { recipe: CookableRecipeDto }) {
  const missing = recipe.missingIngredients;
  const ready = recipe.verdict === RecipeVerdict.CanCook && missing.length === 0;
  return (
    <p className={ready ? "readiness readiness-ready" : "readiness"}>
      <span className="readiness-dot" aria-hidden="true" />
      <span>
        {ready ? (
          <>
            <strong>Tens tudo.</strong> {recipe.requiredCount} de {recipe.requiredCount} ingredientes em casa.
          </>
        ) : (
          <>
            <strong>
              Tens {recipe.availableCount} de {recipe.requiredCount}.
            </strong>{" "}
            {missing.length > 0 && (
              <>
                {missing.length === 1 ? "Falta" : "Faltam"} {listFormat.format(missing.map((i) => i.name))}.
              </>
            )}
          </>
        )}
      </span>
    </p>
  );
}

function DayReadiness({ missing }: { missing: string[] }) {
  const ready = missing.length === 0;
  return (
    <p className={ready ? "readiness readiness-ready" : "readiness"}>
      <span className="readiness-dot" aria-hidden="true" />
      <span>
        {ready ? (
          <strong>Tens tudo.</strong>
        ) : (
          <>
            <strong>
              {missing.length === 1 ? "Falta" : "Faltam"} {missing.length}:
            </strong>{" "}
            {listFormat.format(missing)}.
          </>
        )}
      </span>
    </p>
  );
}

/** Os nomes do que falta num dia, a partir da disponibilidade do plano. */
function missingFrom(availability: Map<IsoDate, PlanAvailabilityDto> | null, date: IsoDate): string[] | null {
  const result = availability?.get(date);
  if (!result) return null;
  return result.lines.filter((line) => line.status !== AvailabilityLineStatus.Available).map((line) => line.label);
}

function NothingPlanned({ cookable }: { cookable: CookableRecipesDto | null }) {
  const ready = cookable
    ? [...cookable.saved, ...cookable.others].filter((r) => r.verdict === RecipeVerdict.CanCook).slice(0, 3)
    : [];
  return (
    <>
      <h1 id="day-dish" className="dish-name dish-name-open">
        Jantar por decidir
      </h1>
      {cookable === null && <p className="muted loading">A ver o que dá para fazer com o que tens…</p>}
      {cookable !== null && ready.length > 0 && (
        <>
          <p className="day-lede">Com o que tens em casa dá para fazer:</p>
          <ul className="cookable-picks">
            {ready.map((recipe) => (
              <li key={recipe.recipeId}>
                <Link to={`/receitas/${recipe.recipeId}`}>{recipe.title}</Link>
                <span className="cookable-picks-meta">{recipe.requiredCount} ingredientes, todos em casa</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {cookable !== null && ready.length === 0 && (
        <p className="day-lede">
          A despensa ainda não chega para nenhuma receita completa. Planeia o jantar e o que falta vai para a lista.
        </p>
      )}
      <div className="day-actions">
        <Link to="/plano" className="button-primary button-lg">
          Planear a semana
        </Link>
        <Link to="/cozinhar" className="button-secondary button-lg">
          Ver tudo o que dá para fazer
        </Link>
      </div>
    </>
  );
}

/** As folhas de baixo: os três dias seguintes, número fixo à esquerda, o prato e se há tudo. */
function NextDays({
  day,
  meals,
  cookable,
  missingOn,
}: {
  day: IsoDate;
  meals: PlannedMealDto[] | null;
  cookable: CookableRecipeDto[];
  missingOn: ((date: IsoDate) => string[] | null) | null;
}) {
  const days = [1, 2, 3].map((offset) => addDays(day, offset));
  return (
    <section className="next-days" aria-label="Próximos dias">
      {days.map((date) => {
        const main = meals ? pickMainMeal(meals.filter((m) => m.date === date)) : null;
        const recipe = main?.recipeId ? (cookable.find((r) => r.recipeId === main.recipeId) ?? null) : null;
        const dayMissing = missingOn?.(date) ?? null;
        const missing = recipe ? recipe.missingIngredients.length : (dayMissing?.length ?? null);
        return (
          <Link key={date} to={main ? "/plano" : "/cozinhar"} className="next-day">
            <span className="next-day-date">
              <span className={isSunday(date) ? "next-day-number day-sunday" : "next-day-number"}>
                {dayNumber(date)}
              </span>
              <span className="next-day-weekday">{weekdayTitle(date).replace("-feira", "")}</span>
            </span>
            <span className="next-day-text">
              <span className={main ? "next-day-dish" : "next-day-dish next-day-open"}>
                {meals === null ? "…" : main ? main.title : "Por planear"}
              </span>
              {main && main.recipeId && missing !== null && (
                <span className={missing === 0 ? "next-day-ready next-day-ready-ok" : "next-day-ready"}>
                  {missing === 0 ? "Tens tudo" : `${missing === 1 ? "Falta" : "Faltam"} ${missing}`}
                </span>
              )}
              {meals !== null && !main && <span className="next-day-ready">Ver o que dá com o que tens</span>}
            </span>
          </Link>
        );
      })}
    </section>
  );
}

/** Urgência como tamanho de ponto, numa escala fixa: quanto mais perto do fim, maior e mais vermelho. */
function UseFirst({ pantry, names }: { pantry: PantryItemDto[] | null; names: (productId: string) => string | null }) {
  return (
    <section className="side-block">
      <div className="side-head">
        <h2>Usar primeiro</h2>
        <Link to="/despensa">Despensa</Link>
      </div>
      {pantry === null && <p className="muted loading">A carregar…</p>}
      {pantry !== null && pantry.length === 0 && (
        <p className="side-empty">
          A despensa está vazia. <Link to="/despensa/adicionar">Guardar as compras</Link>
        </p>
      )}
      {pantry !== null && pantry.length > 0 && (
        <ul className="use-first">
          {pantry.map((item) => {
            const u = urgency(item.expiresAt);
            return (
              <li key={item.pantryItemId} className={`use-first-item urgency-${u.level}`}>
                <span className="urgency-dot" aria-hidden="true" />
                <span className="use-first-name">
                  <Link to={`/produtos/${item.productId}`}>{names(item.productId) ?? "…"}</Link>
                  <span className="use-first-meta">
                    {quantityFormat.format(item.quantity.amount)} {measurementUnitLabels[item.quantity.unit]}
                    {item.openedAt !== null && " · aberto"}
                  </span>
                </span>
                <span className="use-first-when">{u.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function OpenLists({ householdId, lists }: { householdId: string; lists: ShoppingListSummaryDto[] | null }) {
  const [comparisons, setComparisons] = useState<Map<string, StoreComparisonDto>>(new Map());
  const requested = useRef(new Set<string>());

  useEffect(() => {
    if (!lists) return;
    // Só as listas com coisas por comprar; a comparação usa os preços dos últimos 3 dias.
    for (const list of lists.slice(0, 3)) {
      if (list.itemCount - list.purchasedItemCount === 0 || requested.current.has(list.shoppingListId)) continue;
      requested.current.add(list.shoppingListId);
      getStoreComparison(householdId, list.shoppingListId)
        .then((result) => setComparisons((prev) => new Map(prev).set(list.shoppingListId, result)))
        .catch(() => undefined);
    }
  }, [householdId, lists]);

  return (
    <section className="side-block">
      <div className="side-head">
        <h2>Compras</h2>
        <Link to="/listas">Listas</Link>
      </div>
      {lists === null && <p className="muted loading">A carregar…</p>}
      {lists !== null && lists.length === 0 && (
        <p className="side-empty">
          Sem listas abertas. <Link to="/listas">Começar uma lista</Link>
        </p>
      )}
      {lists !== null && lists.length > 0 && (
        <ul className="list-tally">
          {lists.map((list) => {
            const left = list.itemCount - list.purchasedItemCount;
            const comparison = comparisons.get(list.shoppingListId);
            const best = comparison?.stores.find((store) => store.storeId === comparison.split.bestStoreId) ?? null;
            return (
              <li key={list.shoppingListId}>
                <Link to={`/listas/${list.shoppingListId}`} className="list-tally-link">
                  <span className="list-tally-count">{list.itemCount === 0 ? 0 : left}</span>
                  <span className="list-tally-text">
                    <span className="list-tally-name">{list.name}</span>
                    <span className="list-tally-meta">
                      {list.itemCount === 0 ? "Vazia" : left === 0 ? "Tudo comprado" : "por comprar"}
                    </span>
                    {comparison && best && (
                      <span className="list-tally-best">
                        Mais barato no {best.chainName} <span className="price-tag">{money.format(best.total)}</span>
                        {best.coveredItemCount < comparison.itemCount && (
                          <span className="list-tally-cover">
                            {best.coveredItemCount} de {comparison.itemCount} com preço
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
