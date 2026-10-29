// Tipos das oportunidades (DomiOS_API_Fase8.md), sem pedidos: os testes
// importam-nos sem a sessão do browser. Enums como números.

export const OpportunityType = {
  ExpiringPantryItem: 0,
  PlannedMealMissingItems: 1,
  GoodPrice: 2,
  ShoppingListSplit: 3,
} as const;
export type OpportunityType = (typeof OpportunityType)[keyof typeof OpportunityType];

export const OpportunityStatus = {
  Open: 0,
  Acted: 1,
  Dismissed: 2,
  Resolved: 3,
  Expired: 4,
} as const;
export type OpportunityStatus = (typeof OpportunityStatus)[keyof typeof OpportunityStatus];

export interface ExpiringPantryItemPayload {
  pantryItemId: string;
  productId: string;
  expiresAt: string;
}

export interface PlannedMealMissingItemsPayload {
  plannedMealId: string;
  recipeId: string;
  date: string;
  missing: { ingredientId: string; name: string }[];
}

export interface GoodPricePayload {
  productId: string;
  storeOfferId: string;
  storeId: string;
  current: number;
  average: number;
  label: string;
}

export interface ShoppingListSplitPayload {
  shoppingListId: string;
  storeCount: number;
  bestStoreId: string;
  savingVsBestStore: number;
}

interface OpportunityBase {
  opportunityId: string;
  householdId: string;
  title: string;
  explanation: string;
  expectedBenefit: number | null;
  currency: string | null;
  critical: boolean;
  validUntil: string;
  status: OpportunityStatus;
  presentedAt: string | null;
  createdAt: string;
}

/** O `payload` depende do `type` (DomiOS_DataModel_Fase8.md, secção 3). */
export type OpportunityDto = OpportunityBase &
  (
    | { type: typeof OpportunityType.ExpiringPantryItem; payload: ExpiringPantryItemPayload }
    | { type: typeof OpportunityType.PlannedMealMissingItems; payload: PlannedMealMissingItemsPayload }
    | { type: typeof OpportunityType.GoodPrice; payload: GoodPricePayload }
    | { type: typeof OpportunityType.ShoppingListSplit; payload: ShoppingListSplitPayload }
  );

export interface OpportunityListDto {
  generatedAt: string;
  items: OpportunityDto[];
  /** Abertas que o orçamento de atenção não deixou mostrar. */
  heldBackCount: number;
  failedSignals: string[];
}
