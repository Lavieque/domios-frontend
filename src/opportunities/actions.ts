import { OpportunityType, type OpportunityDto } from "../api/opportunityTypes";
import { tr } from "../i18n";

export interface OpportunityAction {
  /** Ecrã onde se faz a ação. */
  to: string;
  linkLabel: string;
  /** Botão que diz à Api que a casa agiu. */
  doneLabel: string;
}

/**
 * Para onde ir e o que dizer depois, por tipo (adenda 2026-10-29 de DomiOS_API_Fase8.md). Um tipo que
 * este frontend ainda não conhece dá `null`: o cartão mostra o título e a explicação da Api, sem ligação.
 */
export function opportunityAction(opportunity: OpportunityDto): OpportunityAction | null {
  const t = tr().ui.opportunities.actions;
  switch (opportunity.type) {
    case OpportunityType.ExpiringPantryItem:
      return { to: "/despensa", linkLabel: t.seeInPantry, doneLabel: t.used };
    case OpportunityType.PlannedMealMissingItems:
      return { to: "/plano", linkLabel: t.seePlan, doneLabel: t.haveIt };
    case OpportunityType.GoodPrice:
      return { to: `/produtos/${opportunity.payload.productId}`, linkLabel: t.seeProduct, doneLabel: t.bought };
    case OpportunityType.ShoppingListSplit:
      return { to: `/listas/${opportunity.payload.shoppingListId}`, linkLabel: t.seeList, doneLabel: tr().ui.opportunities.done };
    case OpportunityType.BelowLastPaid:
      return { to: `/produtos/${opportunity.payload.productId}`, linkLabel: t.seeProduct, doneLabel: t.bought };
    default:
      return null;
  }
}
