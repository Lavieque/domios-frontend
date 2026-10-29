import { useState } from "react";
import { Link } from "react-router-dom";
import {
  actOnOpportunity,
  dismissOpportunity,
  OpportunityType,
  type OpportunityDto,
} from "../api/opportunities";
import { addPlanToShoppingList } from "../api/shopping";
import { ApiError } from "../api/http";
import { describeError } from "../auth/errors";
import { money } from "../catalog/offers";
import { SendToListForm } from "../components/SendToListForm";
import { shortDate } from "../plan/dates";
import { opportunityAction } from "./actions";
import { useOpportunities } from "./useOpportunities";

/**
 * Sugestões da casa (DomiOS_API_Fase8.md): só as que o orçamento de atenção
 * deixa mostrar. Sem nenhuma, o painel não aparece.
 */
export function OpportunitiesPanel({ householdId }: { householdId: string }) {
  const { opportunities, remove } = useOpportunities(householdId);

  if (!opportunities || opportunities.items.length === 0) return null;

  return (
    <section className="panel opportunities-panel">
      <h2>Sugestões</h2>
      <ul className="opportunity-list">
        {opportunities.items.map((opportunity) => (
          <OpportunityCard
            key={opportunity.opportunityId}
            householdId={householdId}
            opportunity={opportunity}
            onClosed={(keepVisible) => remove(opportunity.opportunityId, keepVisible)}
          />
        ))}
      </ul>
      {opportunities.heldBackCount > 0 && (
        <p className="muted">
          {opportunities.heldBackCount === 1
            ? "Mais 1 sugestão à espera."
            : `Mais ${opportunities.heldBackCount} sugestões à espera.`}
        </p>
      )}
    </section>
  );
}

function OpportunityCard({
  householdId,
  opportunity,
  onClosed,
}: {
  householdId: string;
  opportunity: OpportunityDto;
  onClosed: (keepVisible: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = opportunityAction(opportunity);

  // Um 409 quer dizer que já não está aberta (outro membro fechou-a, ou expirou):
  // sai do ecrã como se tivesse corrido bem.
  async function close(request: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await request();
      onClosed(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) onClosed(false);
      else setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={opportunity.critical ? "opportunity opportunity-critical" : "opportunity"}>
      <div className="opportunity-head">
        <strong>{opportunity.title}</strong>
        {opportunity.expectedBenefit !== null && opportunity.expectedBenefit > 0 && (
          <span className="pill pill-accent2">poupa ~{money.format(opportunity.expectedBenefit)}</span>
        )}
      </div>
      <p className="muted">{opportunity.explanation}</p>

      {/* O formulário fica depois de enviar: é ele que mostra "Ver a lista". */}
      {opportunity.type === OpportunityType.PlannedMealMissingItems && (
        <SendToListForm
          householdId={householdId}
          newListName={`Compras de ${shortDate(opportunity.payload.date)}`}
          submitLabel="Pôr o que falta na lista"
          send={async (listId) => {
            const date = opportunity.payload.date;
            const result = await addPlanToShoppingList(householdId, listId, date, date);
            // A lista já está feita; se o act falhar, a geração seguinte resolve-a.
            await actOnOpportunity(householdId, opportunity.opportunityId).catch(() => undefined);
            setClosed(true);
            onClosed(true);
            return { list: result.shoppingList, added: result.addedItemCount };
          }}
        />
      )}

      {!closed && (
        <div className="button-row">
          <Link to={action.to} className="button-secondary">
            {action.linkLabel}
          </Link>
          <button
            type="button"
            className="button-secondary"
            disabled={busy}
            onClick={() => close(() => actOnOpportunity(householdId, opportunity.opportunityId))}
          >
            {action.doneLabel}
          </button>
          <button
            type="button"
            className="link-button"
            disabled={busy}
            onClick={() => close(() => dismissOpportunity(householdId, opportunity.opportunityId))}
          >
            Dispensar
          </button>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
