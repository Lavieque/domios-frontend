import { OpportunityType, type OpportunityDto } from "../api/opportunityTypes";

export interface OpportunityAction {
  /** Ecrã onde se faz a ação. */
  to: string;
  linkLabel: string;
  /** Botão que diz à Api que a casa agiu. */
  doneLabel: string;
}

/** Para onde ir e o que dizer depois, por tipo (adenda 2026-10-29 de DomiOS_API_Fase8.md). */
export function opportunityAction(opportunity: OpportunityDto): OpportunityAction {
  switch (opportunity.type) {
    case OpportunityType.ExpiringPantryItem:
      return { to: "/despensa", linkLabel: "Ver na despensa", doneLabel: "Usei" };
    case OpportunityType.PlannedMealMissingItems:
      return { to: "/plano", linkLabel: "Ver o plano", doneLabel: "Já tenho" };
    case OpportunityType.GoodPrice:
      return { to: `/produtos/${opportunity.payload.productId}`, linkLabel: "Ver o produto", doneLabel: "Comprei" };
    case OpportunityType.ShoppingListSplit:
      return { to: `/listas/${opportunity.payload.shoppingListId}`, linkLabel: "Ver a lista", doneLabel: "Feito" };
  }
}
