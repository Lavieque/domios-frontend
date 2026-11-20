import { useLoad } from "../useLoad";
import { Link, useSearchParams } from "react-router-dom";
import { getHousehold, type CallerHouseholdDto, type MemberDto } from "../api/households";
import { getNutritionGoals, type MemberNutritionGoalsDto } from "../api/memberPreferences";
import {
  getNutritionScore,
  getNutritionSummary,
  NutritionScoreComponent,
  NutritionScoreSource,
  NutritionScoreUnavailableReason,
  type NutritionScoreDto,
  type NutritionSummaryDto,
} from "../api/nutrition";
import { MealSharesPanel } from "../components/MealSharesPanel";
import { HouseholdGate } from "../household/HouseholdGate";
import { goalRows, mealsOverFatLimit, type GoalRow } from "../household/nutritionView";
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today, weekdayTitle } from "../plan/dates";
import { numberFormat as intlNumber } from "../i18n/format";
import { localized, tr, type Dict } from "../i18n";

const isSunday = (date: string) => new Date(`${date}T12:00:00`).getDay() === 0;

const numberFormat = intlNumber({
  maximumFractionDigits: 1,
});

function byComponent(pick: (t: Dict) => Dict["nutrition"]["components"]) {
  return localized<Record<NutritionScoreComponent, string>>((t) => {
    const labels = pick(t);
    return {
      [NutritionScoreComponent.Balance]: labels.Balance,
      [NutritionScoreComponent.Limits]: labels.Limits,
      [NutritionScoreComponent.Fiber]: labels.Fiber,
      [NutritionScoreComponent.Variety]: labels.Variety,
    };
  });
}

const componentLabels = byComponent((t) => t.nutrition.components);
const componentHints = byComponent((t) => t.nutrition.componentHints);

export function NutritionPage() {
  return <HouseholdGate>{(household) => <Nutrition household={household} />}</HouseholdGate>;
}

function Nutrition({ household }: { household: CallerHouseholdDto }) {
  const householdId = household.householdId;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("semana");
  const monday = startOfWeek(isIsoDate(requested) ? requested : today());
  const sunday = addDays(monday, 6);
  // A semana em curso conta só até hoje: os dias que ainda não passaram baixariam a média por dia.
  const last = today() >= monday && today() < sunday ? today() : sunday;
  const memberParam = searchParams.get("quem");

  // Sem a lista de membros (falhou), fica a casa toda.
  const memberList = useLoad([householdId], () => getHousehold(householdId).then((result) => result.members, (): MemberDto[] => []));
  const members: MemberDto[] = memberList.data ?? [];

  // Um membro que já saiu da casa cai na casa toda, em vez de dar 400.
  const memberId = members.some((m) => m.memberId === memberParam) ? memberParam : null;
  const waitingForMembers = memberParam !== null && memberList.loading;

  const week = useLoad(waitingForMembers ? null : [householdId, monday, last, memberId], () =>
    Promise.all([
      getNutritionSummary(householdId, monday, last, memberId),
      getNutritionScore(householdId, monday, last, memberId),
      // Os objetivos são um extra: sem eles o resumo mostra-se na mesma.
      memberId ? getNutritionGoals(householdId, memberId).catch(() => null) : Promise.resolve(null),
    ]),
  );
  const [summary, score, goals]: [NutritionSummaryDto | null, NutritionScoreDto | null, MemberNutritionGoalsDto | null] = week.data ?? [
    null,
    null,
    null,
  ];
  const loading = waitingForMembers || week.loading;
  const error = week.error;

  function change(next: { semana?: string; quem?: string | null }) {
    const params = new URLSearchParams(searchParams);
    if (next.semana !== undefined) params.set("semana", next.semana);
    if (next.quem !== undefined) {
      if (next.quem) params.set("quem", next.quem);
      else params.delete("quem");
    }
    setSearchParams(params);
  }

  const memberName = members.find((m) => m.memberId === memberId)?.name;
  const rows = summary ? goalRows(summary, goals) : [];
  const overFat = summary && goals?.isSet ? mealsOverFatLimit(summary) : null;

  return (
    <div className="page nutrition-page">
      <header className="page-head">
        <div>
          <h1>{tr().nutrition.title}</h1>
          <p className="page-head-sub">
            {memberName ? tr().nutrition.subByMember(memberName) : tr().nutrition.subByHousehold(household.name)}
          </p>
        </div>
      </header>

      <section className="panel" aria-labelledby="nutrition-week-title">
        <div className="section-head">
          <h2 id="nutrition-week-title">{tr().nutrition.weekTitle}</h2>
          <span className="badge">
            {shortDate(monday)} – {longDate(sunday)}
          </span>
        </div>

        <nav className="nutrition-controls" aria-label={tr().nutrition.weeks}>
          <button type="button" className="chip" onClick={() => change({ semana: addDays(monday, -7) })}>
            {tr().nutrition.previous}
          </button>
          <button type="button" className="chip" onClick={() => change({ semana: startOfWeek(today()) })}>
            {tr().nutrition.thisWeek}
          </button>
          <button type="button" className="chip" onClick={() => change({ semana: addDays(monday, 7) })}>
            {tr().nutrition.next}
          </button>
          <label className="nutrition-who">
            <span>{tr().nutrition.view}</span>
            <select value={memberId ?? ""} onChange={(e) => change({ quem: e.target.value })}>
              <option value="">{tr().nutrition.wholeHousehold}</option>
              {members.map((member) => (
                <option key={member.memberId} value={member.memberId}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </nav>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="muted loading">{tr().common.loading}</p>}

        {!loading && summary && score && (
          <>
            <ScoreStatus score={score} />
            <WeekMetrics summary={summary} />
            <p className="muted">
              {summary.mealCount === 0
                ? tr().nutrition.noMeals
                : last !== sunday
                  ? tr().nutrition.currentWeek + tr().nutrition.averages
                  : tr().nutrition.averagesFull}
            </p>
            <div className="panel-actions">
              <Link to="/cozinhar" className="button-primary">
                {tr().nutrition.pickRecipe}
              </Link>
            </div>
          </>
        )}
      </section>

      {!loading && summary && memberId && (
        <GoalsPanel
          rows={rows}
          hasGoals={goals?.isSet === true}
          overFat={overFat}
          maxFatPerMealG={goals?.maxFatPerMealG ?? null}
          memberName={memberName ?? ""}
        />
      )}

      <div className="home-grid home-grid-bottom">
        <section className="panel edge-photo edge-nutrition">
          <h2>{tr().nutrition.yourGoals}</h2>
          <p className="muted">
            {memberId
              ? tr().nutrition.goalsInHousehold
              : tr().nutrition.goalsPerPerson}
          </p>
          <div className="panel-actions">
            <Link to="/casa" className="button-secondary">
              {tr().nutrition.editGoals}
            </Link>
          </div>
        </section>
        <section className="panel edge-photo edge-balanced">
          <h2>{tr().nutrition.mindful}</h2>
          <p className="muted">
            {tr().nutrition.disclaimer}
            {summary && summary.uncoveredItemCount > 0 && (
              <>
                {" "}
                {tr().nutrition.uncovered(summary.uncoveredItemCount)}
              </>
            )}
          </p>
        </section>
      </div>

      {!loading && summary && summary.mealCount > 0 && (
        <details className="panel nutrition-days-panel">
          <summary>
            <h2>{tr().nutrition.dayByDay}</h2>
            <span className="arrow-link">{tr().nutrition.seeDayTotals}</span>
          </summary>
          <DaysTable summary={summary} />
        </details>
      )}

      {!loading && summary && summary.mealCount > 0 && (
        <MealSharesPanel householdId={householdId} from={monday} to={last} memberId={memberId} members={members} />
      )}
    </div>
  );
}

/** O círculo do preview com o score da semana e as quatro partes que o compõem. */
function ScoreStatus({ score }: { score: NutritionScoreDto }) {
  const available = score.score !== null;
  return (
    <div className="status-card">
      <div className="status-circle" aria-hidden="true">
        {available ? score.score : "–"}
      </div>
      <div className="status-body">
        <h3>{available ? tr().nutrition.weekScore(score.score ?? 0) : tr().nutrition.startFirstMeal}</h3>
        <p className="muted">
          {!available
            ? score.unavailableReason === NutritionScoreUnavailableReason.NoData
              ? tr().nutrition.noData
              : tr().nutrition.fewData
            : `${score.source === NutritionScoreSource.Plan ? tr().nutrition.fromPlan : tr().nutrition.fromMeals}${score.personalGoalsApplied ? tr().nutrition.personalGoals : ""}`}
        </p>
        {available && (
          <ul className="status-parts">
            {score.components.map((part) => (
              <li key={part.component} title={componentHints[part.component]}>
                <span>{componentLabels[part.component]}</span>
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (part.points / part.maxPoints) * 100)}%` }} />
                </span>
                <span className="status-part-points">
                  {numberFormat.format(part.points)}/{part.maxPoints}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** As quatro caixas do preview: refeições e a média por dia de energia, proteína e fibra. */
function WeekMetrics({ summary }: { summary: NutritionSummaryDto }) {
  const days = Math.max(1, summary.days.length);
  const t = tr().nutrition;
  const metrics = [
    { label: t.mealsLogged, value: numberFormat.format(summary.mealCount), hint: t.thisWeekHint },
    { label: t.energy, value: `${numberFormat.format(Math.round(summary.total.energyKcal / days))} kcal`, hint: t.perDayAverage },
    { label: t.protein, value: `${numberFormat.format(summary.total.protein / days)} g`, hint: t.perDayAverage },
    { label: t.fiber, value: `${numberFormat.format(summary.total.fiber / days)} g`, hint: t.perDayAverage },
  ];
  return (
    <div className="metrics">
      {metrics.map((metric) => (
        <div key={metric.label} className="metric">
          <span className="muted">{metric.label}</span>
          <b>{metric.value}</b>
          <span className="metric-hint">{metric.hint}</span>
        </div>
      ))}
    </div>
  );
}

function GoalsPanel({
  rows,
  hasGoals,
  overFat,
  maxFatPerMealG,
  memberName,
}: {
  rows: GoalRow[];
  hasGoals: boolean;
  overFat: number | null;
  maxFatPerMealG: number | null;
  memberName: string;
}) {
  if (!hasGoals) {
    return (
      <section className="panel" aria-labelledby="nutrition-goals-title">
        <h2 id="nutrition-goals-title">{tr().nutrition.goals}</h2>
        <p className="muted">
          {memberName} {tr().nutrition.noGoals.after} <Link to="/casa">{tr().nutrition.noGoals.link}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="nutrition-goals-title">
      <h2 id="nutrition-goals-title">{tr().nutrition.goalsOf(memberName)}</h2>
      {rows.length === 0 ? (
        <p className="muted">{tr().nutrition.nothingToCompare}</p>
      ) : (
        <ul className="nutrition-goal-list">
          {rows.map((row) => (
            <li key={row.key} className={row.overTarget ? "is-over" : undefined}>
              <span className="nutrition-goal-name">
                {row.label}
                {row.isMax && <span className="muted">{tr().nutrition.max}</span>}
              </span>
              <span className={row.overTarget ? "meter meter-over" : "meter"} aria-hidden="true">
                <span style={{ width: `${Math.min(100, row.percent)}%` }} />
              </span>
              <span className="nutrition-goal-percent">{numberFormat.format(row.percent)} %</span>
              <span className="muted nutrition-goal-detail">
                {tr().nutrition.perDayOf(numberFormat.format(row.perDay), numberFormat.format(row.target), row.unit)}
                {row.overTarget && tr().nutrition.overMax}
              </span>
            </li>
          ))}
        </ul>
      )}
      {overFat !== null && (
        <p className={overFat > 0 ? "nutrition-fat-limit is-over" : "nutrition-fat-limit muted"}>
          {overFat === 0
            ? tr().nutrition.noMealOverFat(numberFormat.format(maxFatPerMealG ?? 0))
            : tr().nutrition.mealsOverFat(overFat, numberFormat.format(maxFatPerMealG ?? 0))}
        </p>
      )}
    </section>
  );
}

function DaysTable({ summary }: { summary: NutritionSummaryDto }) {
  const showFatLimit = summary.days.some((day) => day.mealsOverFatLimit !== null);
  const t = tr().nutrition;
  return (
    <div className="table-wrap nutrition-days">
        <table>
          <caption className="visually-hidden">{t.totalsPerDay}</caption>
          <thead>
            <tr>
              <th scope="col">{t.day}</th>
              <th scope="col" className="num">
                {t.meals}
              </th>
              <th scope="col" className="num">
                kcal
              </th>
              <th scope="col" className="num">
                {t.proteinG}
              </th>
              <th scope="col" className="num">
                {t.carbsG}
              </th>
              <th scope="col" className="num">
                {t.fatG}
              </th>
              <th scope="col" className="num">
                {t.saltG}
              </th>
              {showFatLimit && (
                <th scope="col" className="num">
                  {t.overFat}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {summary.days.map((day) => (
              <tr key={day.date} className={day.mealCount === 0 ? "is-empty" : undefined}>
                <th scope="row">
                  <span className="nutrition-day">
                    <span
                      className={
                        isSunday(day.date) || day.date === today()
                          ? "nutrition-day-number is-red"
                          : "nutrition-day-number"
                      }
                    >
                      {Number(day.date.slice(8, 10))}
                    </span>
                    <span className="nutrition-day-weekday">{weekdayTitle(day.date).replace("-feira", "")}</span>
                  </span>
                </th>
                <td className="num" data-label={t.meals}>
                  {day.mealCount}
                </td>
                <td className="num" data-label="kcal">
                  {numberFormat.format(day.nutrients.energyKcal)}
                </td>
                <td className="num" data-label={t.proteinG}>
                  {numberFormat.format(day.nutrients.protein)}
                </td>
                <td className="num" data-label={t.carbsG}>
                  {numberFormat.format(day.nutrients.carbs)}
                </td>
                <td className="num" data-label={t.fatG}>
                  {numberFormat.format(day.nutrients.fat)}
                </td>
                <td className="num" data-label={t.saltG}>
                  {numberFormat.format(day.nutrients.salt)}
                </td>
                {showFatLimit && (
                  <td className="num" data-label={t.overFat}>
                    {day.mealsOverFatLimit ?? "–"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
