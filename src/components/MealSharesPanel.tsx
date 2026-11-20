import { useState } from "react";
import type { MemberDto } from "../api/households";
import { mealTypeLabels } from "../api/planning";
import {
  getMealNutrition,
  listLoggedMeals,
  type MealSummaryDto,
  type NutrientsDto,
} from "../api/nutrition";
import { mealShares } from "../household/nutritionView";
import { numberFormat as intlNumber } from "../i18n/format";
import { tr } from "../i18n";
import { localDay, shortDate, type IsoDate } from "../plan/dates";
import { useLoad } from "../useLoad";

const numberFormat = intlNumber({ maximumFractionDigits: 1 });

/** "Refeição a refeição": as refeições registadas da semana, cada uma com a parte de cada pessoa. */
export function MealSharesPanel({
  householdId,
  from,
  to,
  memberId,
  members,
}: {
  householdId: string;
  from: IsoDate;
  to: IsoDate;
  memberId: string | null;
  members: MemberDto[];
}) {
  const t = tr().nutrition;
  const [open, setOpen] = useState(false);
  // Só se lê a lista quando o painel se abre: a maioria das visitas não o abre.
  const meals = useLoad(open ? [householdId, from, to, memberId] : null, () =>
    listLoggedMeals(householdId, from, to, memberId),
  );

  return (
    <details className="panel nutrition-meals-panel" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <h2>{t.mealByMeal}</h2>
        <span className="arrow-link">{t.seeMealShares}</span>
      </summary>
      {open && meals.loading && <p className="muted loading">{tr().common.loading}</p>}
      {open && meals.error && (
        <p className="form-error" role="alert">
          {meals.error}
        </p>
      )}
      {open && meals.data && meals.data.items.length === 0 && <p className="muted">{t.mealSharesNone}</p>}
      {open && meals.data && meals.data.items.length > 0 && (
        <>
          <ul className="nutrition-meal-list">
            {meals.data.items.map((meal) => (
              <MealRow key={meal.mealId} householdId={householdId} meal={meal} members={members} />
            ))}
          </ul>
          <p className="muted">{t.mealSharesNote}</p>
        </>
      )}
    </details>
  );
}

function MealRow({ householdId, meal, members }: { householdId: string; meal: MealSummaryDto; members: MemberDto[] }) {
  const t = tr().nutrition;
  const [open, setOpen] = useState(false);
  const nutrition = useLoad(open ? [householdId, meal.mealId] : null, () => getMealNutrition(householdId, meal.mealId));
  const shares = nutrition.data ? mealShares(nutrition.data, members) : [];

  return (
    <li>
      <details onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>
          <span className="nutrition-meal-title">{meal.title}</span>
          <span className="muted">
            {shortDate(localDay(meal.eatenAt))} · {mealTypeLabels[meal.mealType as keyof typeof mealTypeLabels]}
          </span>
        </summary>
        {open && nutrition.loading && <p className="muted loading">{tr().common.loading}</p>}
        {open && nutrition.error && (
          <p className="form-error" role="alert">
            {t.mealLoadFailed}
          </p>
        )}
        {open && nutrition.data && (
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">{meal.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.person}</th>
                  <th scope="col" className="num">
                    {t.portion}
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
                </tr>
              </thead>
              <tbody>
                {shares.map((share) => (
                  <NutrientRow
                    key={share.memberId}
                    label={share.name ?? t.formerMember}
                    portion={numberFormat.format(share.portion)}
                    nutrients={share.nutrients}
                  />
                ))}
                {shares.length === 0 && nutrition.data.perParticipant && (
                  <NutrientRow label={t.perPerson} portion="–" nutrients={nutrition.data.perParticipant} />
                )}
                <NutrientRow label={t.mealTotal} portion="–" nutrients={nutrition.data.total} total />
              </tbody>
            </table>
          </div>
        )}
      </details>
    </li>
  );
}

function NutrientRow({
  label,
  portion,
  nutrients,
  total,
}: {
  label: string;
  portion: string;
  nutrients: NutrientsDto;
  total?: boolean;
}) {
  const t = tr().nutrition;
  return (
    <tr className={total ? "is-total" : undefined}>
      <th scope="row">{label}</th>
      <td className="num" data-label={t.portion}>
        {portion}
      </td>
      <td className="num" data-label="kcal">
        {numberFormat.format(nutrients.energyKcal)}
      </td>
      <td className="num" data-label={t.proteinG}>
        {numberFormat.format(nutrients.protein)}
      </td>
      <td className="num" data-label={t.carbsG}>
        {numberFormat.format(nutrients.carbs)}
      </td>
      <td className="num" data-label={t.fatG}>
        {numberFormat.format(nutrients.fat)}
      </td>
    </tr>
  );
}
