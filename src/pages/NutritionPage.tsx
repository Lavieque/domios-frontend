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
import { addDays, isIsoDate, longDate, shortDate, startOfWeek, today } from "../plan/dates";

const numberFormat = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });

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
    <div className="page">
      <h1>Nutrição</h1>
      <p className="page-sub">{household.name}</p>

      <div className="week-nav">
        <button type="button" className="button-secondary" onClick={() => change({ semana: addDays(monday, -7) })}>
          Semana anterior
        </button>
        <span className="week-range">
          {shortDate(monday)} – {longDate(sunday)}
        </span>
        <button type="button" className="button-secondary" onClick={() => change({ semana: addDays(monday, 7) })}>
          Semana seguinte
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
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted loading">A carregar…</p>}

      {!loading && summary && score && (
        <>
          <ScorePanel score={score} />

          {memberId ? (
            <GoalsPanel
              rows={rows}
              hasGoals={goals?.isSet === true}
              overFat={overFat}
              maxFatPerMealG={goals?.maxFatPerMealG ?? null}
              memberName={memberName ?? ""}
            />
          ) : (
            <p className="muted nutrition-note">
              Os objetivos são de cada pessoa. Escolhe um membro em «Ver» para os comparar com o que comeu.
            </p>
          )}

          <DaysTable summary={summary} />

          {summary.uncoveredItemCount > 0 && (
            <p className="muted nutrition-note">
              {summary.uncoveredItemCount}{" "}
              {summary.uncoveredItemCount === 1 ? "alimento não entra" : "alimentos não entram"} nas contas por não ter
              dados nutricionais. Os totais podem ficar abaixo do real.
            </p>
          )}
          <p className="muted nutrition-note">
            {last !== sunday && "A semana em curso conta até hoje. "}É informação das refeições registadas, não um
            conselho médico.
          </p>
        </>
      )}
    </div>
  );
}

function ScorePanel({ score }: { score: NutritionScoreDto }) {
  if (score.score === null) {
    return (
      <section className="panel nutrition-score" aria-labelledby="nutrition-score-title">
        <h2 id="nutrition-score-title">Score da semana</h2>
        <p className="muted">
          {score.unavailableReason === NutritionScoreUnavailableReason.NoData
            ? "Sem refeições registadas nem planeadas nesta semana."
            : "Há poucos alimentos com dados nutricionais para dar um score fiável."}
        </p>
      </section>
    );
  }

  return (
    <section className="panel nutrition-score" aria-labelledby="nutrition-score-title">
      <h2 id="nutrition-score-title">Score da semana</h2>
      <div className="nutrition-score-body">
        <p className="nutrition-score-value">
          <strong>{score.score}</strong>
          <span> / 100</span>
        </p>
        <ul className="nutrition-components">
          {score.components.map((part) => (
            <li key={part.component}>
              <span className="nutrition-component-name">{componentLabels[part.component]}</span>
              <span className="meter" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (part.points / part.maxPoints) * 100)}%` }} />
              </span>
              <span className="nutrition-component-points">
                {numberFormat.format(part.points)} / {part.maxPoints}
              </span>
              <span className="muted nutrition-component-hint">{componentHints[part.component]}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="muted nutrition-note">
        {score.source === NutritionScoreSource.Plan
          ? "Calculado a partir do plano da semana."
          : "Calculado a partir das refeições registadas."}
        {score.personalGoalsApplied && " Os limites e a fibra são medidos contra os alvos definidos para esta pessoa."}
      </p>
    </section>
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
            <th scope="col" className="num">Refeições</th>
            <th scope="col" className="num">kcal</th>
            <th scope="col" className="num">Proteína (g)</th>
            <th scope="col" className="num">Hidratos (g)</th>
            <th scope="col" className="num">Gordura (g)</th>
            <th scope="col" className="num">Sal (g)</th>
            {showFatLimit && <th scope="col" className="num">Acima do máx. de gordura</th>}
          </tr>
        </thead>
        <tbody>
          {summary.days.map((day) => (
            <tr key={day.date} className={day.mealCount === 0 ? "is-empty" : undefined}>
              <th scope="row">{shortDate(day.date)}</th>
              <td className="num">{day.mealCount}</td>
              <td className="num">{numberFormat.format(day.nutrients.energyKcal)}</td>
              <td className="num">{numberFormat.format(day.nutrients.protein)}</td>
              <td className="num">{numberFormat.format(day.nutrients.carbs)}</td>
              <td className="num">{numberFormat.format(day.nutrients.fat)}</td>
              <td className="num">{numberFormat.format(day.nutrients.salt)}</td>
              {showFatLimit && <td className="num">{day.mealsOverFatLimit ?? "–"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
