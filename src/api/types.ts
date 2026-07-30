// Espelha os DTOs reais da DomiOS.Api (repo DomiOS) — sem geração automática,
// ver justificação no plano ("3 páginas não justificam essa máquina"). A Api
// serializa enums como NÚMEROS (sem JsonStringEnumConverter), nunca como
// strings — os valores abaixo têm de acompanhar sempre os enums reais do
// lado do DomiOS se estes alguma vez mudarem de ordem.
//
// `const ... as const` + tipo derivado em vez de `enum` — o tsconfig deste
// projeto tem `erasableSyntaxOnly: true` (não permite `enum`, que gera
// código em runtime, só sintaxe puramente apagável em compilação).

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const MeasurementUnit = {
  Unit: 0,
  Gram: 1,
  Kilogram: 2,
  Milliliter: 3,
  Liter: 4,
} as const;
export type MeasurementUnit = (typeof MeasurementUnit)[keyof typeof MeasurementUnit];

export const measurementUnitLabels: Record<MeasurementUnit, string> = {
  [MeasurementUnit.Unit]: "un",
  [MeasurementUnit.Gram]: "g",
  [MeasurementUnit.Kilogram]: "kg",
  [MeasurementUnit.Milliliter]: "ml",
  [MeasurementUnit.Liter]: "l",
};

export const ProductStatus = {
  Active: 0,
  Discontinued: 1,
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProductSource = {
  Manual: 0,
  Scraper: 1,
  Api: 2,
} as const;
export type ProductSource = (typeof ProductSource)[keyof typeof ProductSource];

export interface CategoryDto {
  categoryId: string;
  name: string;
  parentCategoryId: string | null;
}

export interface NutritionFactsDto {
  energyKcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  saturates: number;
  fiber: number;
  salt: number;
}

export interface ProductDto {
  productId: string;
  name: string;
  brand: string | null;
  category: CategoryDto;
  barcode: string | null;
  packageQuantity: number;
  packageUnit: MeasurementUnit;
  imageUrl: string | null;
  allergens: string[];
  nutritionFacts: NutritionFactsDto;
  status: ProductStatus;
  source: ProductSource;
  ingredientId: string | null;
}

export const StoreOfferAvailability = {
  Unknown: 0,
  InStock: 1,
  OutOfStock: 2,
} as const;
export type StoreOfferAvailability = (typeof StoreOfferAvailability)[keyof typeof StoreOfferAvailability];

export const PriceObservationSource = {
  Manual: 0,
  Scraper: 1,
  Api: 2,
} as const;
export type PriceObservationSource = (typeof PriceObservationSource)[keyof typeof PriceObservationSource];

export interface MoneyDto {
  amount: number;
  currency: string;
}

export interface PriceObservationDto {
  priceObservationId: string;
  price: MoneyDto;
  observedAt: string;
  source: PriceObservationSource;
  confidence: number;
  promotionId: string | null;
}

export interface ProductStoreOfferDto {
  storeOfferId: string;
  storeId: string;
  storeName: string;
  chainId: string;
  chainName: string;
  availability: StoreOfferAvailability;
  latestPrice: PriceObservationDto | null;
}

export const PromotionType = {
  PercentageOff: 0,
  FixedAmountOff: 1,
  BuyXGetY: 2,
  BundlePrice: 3,
} as const;
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];

export const PromotionStatus = {
  Active: 0,
  Cancelled: 1,
} as const;
export type PromotionStatus = (typeof PromotionStatus)[keyof typeof PromotionStatus];

export const promotionTypeLabels: Record<PromotionType, string> = {
  [PromotionType.PercentageOff]: "Desconto percentual",
  [PromotionType.FixedAmountOff]: "Desconto fixo",
  [PromotionType.BuyXGetY]: "Compre X, leve Y",
  [PromotionType.BundlePrice]: "Preço de pack",
};

export interface PromotionDto {
  promotionId: string;
  type: PromotionType;
  description: string;
  startsAt: string;
  endsAt: string;
  minQuantity: number | null;
  maxQuantity: number | null;
  requiresCard: boolean;
  status: PromotionStatus;
}

export const RecipeDifficulty = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
} as const;
export type RecipeDifficulty = (typeof RecipeDifficulty)[keyof typeof RecipeDifficulty];

export const recipeDifficultyLabels: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.Easy]: "Fácil",
  [RecipeDifficulty.Medium]: "Média",
  [RecipeDifficulty.Hard]: "Difícil",
};

export const RecipeStatus = {
  Draft: 0,
  Published: 1,
  Archived: 2,
} as const;
export type RecipeStatus = (typeof RecipeStatus)[keyof typeof RecipeStatus];

export const RecipeSource = {
  Manual: 0,
  Ai: 1,
  Import: 2,
} as const;
export type RecipeSource = (typeof RecipeSource)[keyof typeof RecipeSource];

export interface QuantityDto {
  amount: number;
  unit: MeasurementUnit;
}

export interface RecipeIngredientDto {
  recipeIngredientId: string;
  ingredientId: string;
  ingredientName: string;
  quantity: QuantityDto;
  notes: string | null;
  isOptional: boolean;
  sortOrder: number;
}

export interface RecipeStepDto {
  recipeStepId: string;
  stepNumber: number;
  instruction: string;
  durationMinutes: number | null;
}

export interface RecipeSummaryDto {
  recipeId: string;
  ownerHouseholdId: string | null;
  title: string;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  tags: string[];
}

export interface RecipeDto {
  recipeId: string;
  ownerHouseholdId: string | null;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  imageUrl: string | null;
  tags: string[];
  source: RecipeSource;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
}

export interface DomainEventLogEntryDto {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  occurredOn: string;
  payload: string;
}
