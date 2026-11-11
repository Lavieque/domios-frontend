import { useEffect, useState } from "react";
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
import { describeError } from "../auth/errors";
import { HouseholdGate } from "../household/HouseholdGate";
import { goalRows, mealsOverFatLimit, type GoalRow } from "../household/nutritionView";
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today, weekdayTitle } from "../plan/dates";

const isSunday = (date: string) => new Date(`${date}T12:00:00`).getDay() === 0;

const numberFormat = new Intl.NumberFormat("pt-PT", {
  maximumFractionDigits: 1,
});

const componentLabels: Record<NutritionScoreComponent, string> = {
  [NutritionScoreComponent.Balance]: "Equilíbrio",
  [NutritionScoreComponent.Limits]: "Limites",
  [NutritionScoreComponent.Fiber]: "Fibra",
  [NutritionScoreComponent.Variety]: "Variedade",
};

const componentHints: Record<NutritionScoreComponent, string> = {
  [NutritionScoreComponent.Balance]: "Proteína, gordura e hidratos na proporção usual",
  [NutritionScoreComponent.Limits]: "Açúcares, saturados e sal",
  [NutritionScoreComponent.Fiber]: "Fibra por cada 1000 kcal",
  [NutritionScoreComponent.Variety]: "Alimentos diferentes por semana",
};

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

  const [members, setMembers] = useState<MemberDto[]>([]);
  const [summary, setSummary] = useState<NutritionSummaryDto | null>(null);
  const [score, setScore] = useState<NutritionScoreDto | null>(null);
  const [goals, setGoals] = useState<MemberNutritionGoalsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHousehold(householdId)
      .then((result) => !cancelled && setMembers(result.members))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  // Um membro que já saiu da casa cai na casa toda, em vez de dar 400.
  const memberId = members.some((m) => m.memberId === memberParam) ? memberParam : null;
  const waitingForMembers = memberParam !== null && members.length === 0;

  useEffect(() => {
    if (waitingForMembers) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getNutritionSummary(householdId, monday, last, memberId),
      getNutritionScore(householdId, monday, last, memberId),
      // Os objetivos são um extra: sem eles o resumo mostra-se na mesma.
      memberId ? getNutritionGoals(householdId, memberId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([nextSummary, nextScore, nextGoals]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setScore(nextScore);
        setGoals(nextGoals);
      })
      .catch((err) => !cancelled && setError(describeError(err, {})))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [householdId, monday, last, memberId, waitingForMembers]);

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
          <h1>Equilíbrio, dia após dia.</h1>
          <p className="page-head-sub">
            Uma visão das refeições registadas {memberName ? `por ${memberName}` : `em ${household.name}`}.
          </p>
        </div>
      </header>

      <section className="panel" aria-labelledby="nutrition-week-title">
        <div className="section-head">
          <h2 id="nutrition-week-title">A semana em perspetiva</h2>
          <span className="badge">
            {shortDate(monday)} – {longDate(sunday)}
          </span>
        </div>

        <nav className="nutrition-controls" aria-label="Semanas">
          <button type="button" className="chip" onClick={() => change({ semana: addDays(monday, -7) })}>
            ← Anterior
          </button>
          <button type="button" className="chip" onClick={() => change({ semana: startOfWeek(today()) })}>
            Esta semana
          </button>
          <button type="button" className="chip" onClick={() => change({ semana: addDays(monday, 7) })}>
            Seguinte →
          </button>
          <label className="nutrition-who">
            <span>Ver</span>
            <select value={memberId ?? ""} onChange={(e) => change({ quem: e.target.value })}>
              <option value="">A casa toda</option>
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
        {loading && <p className="muted loading">A carregar…</p>}

        {!loading && summary && score && (
          <>
            <ScoreStatus score={score} />
            <WeekMetrics summary={summary} />
            <p className="muted">
              {summary.mealCount === 0
                ? "Ainda não há refeições registadas nesta semana. Abre uma receita e escolhe “Já cozinhei” para começar."
                : `${last !== sunday ? "A semana em curso conta até hoje; " : ""}os valores são médias por dia das refeições registadas.`}
            </p>
            <div className="panel-actions">
              <Link to="/cozinhar" className="button-primary">
                Escolher uma receita
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
          <h2>Os teus objetivos</h2>
          <p className="muted">
            {memberId
              ? "Os objetivos diários de cada pessoa definem-se em Casa."
              : "Os objetivos são de cada pessoa: escolhe alguém em «Ver» para comparar com o que comeu."}
          </p>
          <div className="panel-actions">
            <Link to="/casa" className="button-secondary">
              Editar objetivos
            </Link>
          </div>
        </section>
        <section className="panel edge-photo edge-balanced">
          <h2>Comer com atenção.</h2>
          <p className="muted">
            Informação das refeições registadas, não um conselho médico.
            {summary && summary.uncoveredItemCount > 0 && (
              <>
                {" "}
                {summary.uncoveredItemCount}{" "}
                {summary.uncoveredItemCount === 1 ? "alimento não entra" : "alimentos não entram"} nas contas por não
                ter dados nutricionais.
              </>
            )}
          </p>
        </section>
      </div>

      {!loading && summary && summary.mealCount > 0 && (
        <details className="panel nutrition-days-panel">
          <summary>
            <h2>Dia a dia</h2>
            <span className="arrow-link">Ver os totais de cada dia</span>
          </summary>
          <DaysTable summary={summary} />
        </details>
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
        <h3>{available ? `Score da semana: ${score.score} de 100` : "Começa pela primeira refeição"}</h3>
        <p className="muted">
          {!available
            ? score.unavailableReason === NutritionScoreUnavailableReason.NoData
              ? "Regista uma refeição em Cozinhar para ver este resumo. Ainda não há informação para comparar com os objetivos."
              : "Há poucos alimentos com dados nutricionais para dar um score fiável."
            : `${score.source === NutritionScoreSource.Plan ? "Calculado a partir do plano da semana." : "Calculado a partir das refeições registadas."}${score.personalGoalsApplied ? " Os limites e a fibra são medidos contra os alvos desta pessoa." : ""}`}
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
  const metrics = [
    { label: "Refeições registadas", value: numberFormat.format(summary.mealCount), hint: "Nesta semana" },
    { label: "Energia", value: `${numberFormat.format(Math.round(summary.total.energyKcal / days))} kcal`, hint: "Por dia, em média" },
    { label: "Proteína", value: `${numberFormat.format(summary.total.protein / days)} g`, hint: "Por dia, em média" },
    { label: "Fibra", value: `${numberFormat.format(summary.total.fiber / days)} g`, hint: "Por dia, em média" },
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
        <h2 id="nutrition-goals-title">Objetivos</h2>
        <p className="muted">
          {memberName} ainda não tem objetivos definidos. <Link to="/casa">Define-os em Casa.</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="nutrition-goals-title">
      <h2 id="nutrition-goals-title">Objetivos de {memberName}</h2>
      {rows.length === 0 ? (
        <p className="muted">Ainda não há refeições nesta semana para comparar.</p>
      ) : (
        <ul className="nutrition-goal-list">
          {rows.map((row) => (
            <li key={row.key} className={row.overTarget ? "is-over" : undefined}>
              <span className="nutrition-goal-name">
                {row.label}
                {row.isMax && <span className="muted"> (máximo)</span>}
              </span>
              <span className={row.overTarget ? "meter meter-over" : "meter"} aria-hidden="true">
                <span style={{ width: `${Math.min(100, row.percent)}%` }} />
              </span>
              <span className="nutrition-goal-percent">{numberFormat.format(row.percent)} %</span>
              <span className="muted nutrition-goal-detail">
                {numberFormat.format(row.perDay)} de {numberFormat.format(row.target)} {row.unit} por dia, em média
                {row.overTarget && " · acima do máximo"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {overFat !== null && (
        <p className={overFat > 0 ? "nutrition-fat-limit is-over" : "nutrition-fat-limit muted"}>
          {overFat === 0
            ? `Nenhuma refeição passou do máximo de ${numberFormat.format(maxFatPerMealG ?? 0)} g de gordura.`
            : `${overFat} ${overFat === 1 ? "refeição passou" : "refeições passaram"} do máximo de ${numberFormat.format(maxFatPerMealG ?? 0)} g de gordura.`}
        </p>
      )}
    </section>
  );
}

function DaysTable({ summary }: { summary: NutritionSummaryDto }) {
  const showFatLimit = summary.days.some((day) => day.mealsOverFatLimit !== null);
  return (
    <div className="table-wrap nutrition-days">
        <table>
          <caption className="visually-hidden">Totais por dia</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col" className="num">
                Refeições
              </th>
              <th scope="col" className="num">
                kcal
              </th>
              <th scope="col" className="num">
                Proteína (g)
              </th>
              <th scope="col" className="num">
                Hidratos (g)
              </th>
              <th scope="col" className="num">
                Gordura (g)
              </th>
              <th scope="col" className="num">
                Sal (g)
              </th>
              {showFatLimit && (
                <th scope="col" className="num">
                  Acima do máx. de gordura
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
                <td className="num" data-label="Refeições">
                  {day.mealCount}
                </td>
                <td className="num" data-label="kcal">
                  {numberFormat.format(day.nutrients.energyKcal)}
                </td>
                <td className="num" data-label="Proteína (g)">
                  {numberFormat.format(day.nutrients.protein)}
                </td>
                <td className="num" data-label="Hidratos (g)">
                  {numberFormat.format(day.nutrients.carbs)}
                </td>
                <td className="num" data-label="Gordura (g)">
                  {numberFormat.format(day.nutrients.fat)}
                </td>
                <td className="num" data-label="Sal (g)">
                  {numberFormat.format(day.nutrients.salt)}
                </td>
                {showFatLimit && (
                  <td className="num" data-label="Acima do máx. de gordura">
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
