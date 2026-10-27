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
  /** Produto que substitui este (descontinuado), se a Api o souber. */
  substitutedByProductId: string | null;
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

/** Preço por kg, L ou unidade, calculado pela Api a partir da embalagem. */
export interface UnitPriceDto {
  amount: number;
  currency: string;
  per: MeasurementUnit;
}

/** Preço com cartão de cliente (promoção com `requiresCard`). */
export interface CardPriceDto {
  amount: number;
  currency: string;
  discountPercent: number;
  promotionId: string;
  endsAt: string;
}

// Price Intelligence (DomiOS_API_Fase2.md, adendas 2026-10-15 e 2026-10-22).

export const PriceLabel = {
  InsufficientHistory: 0,
  HistoricLow: 1,
  BelowAverage: 2,
  Usual: 3,
  AboveAverage: 4,
} as const;
export type PriceLabel = (typeof PriceLabel)[keyof typeof PriceLabel];

export const priceLabelLabels: Record<PriceLabel, string> = {
  [PriceLabel.InsufficientHistory]: "Histórico insuficiente",
  [PriceLabel.HistoricLow]: "Mínimo do período",
  [PriceLabel.BelowAverage]: "Abaixo da média",
  [PriceLabel.Usual]: "Preço habitual",
  [PriceLabel.AboveAverage]: "Acima da média",
};

export const PromotionVerdict = {
  InsufficientHistory: 0,
  NoRealDiscount: 1,
  InflatedReference: 2,
  Genuine: 3,
} as const;
export type PromotionVerdict = (typeof PromotionVerdict)[keyof typeof PromotionVerdict];

export const promotionVerdictLabels: Record<PromotionVerdict, string> = {
  [PromotionVerdict.InsufficientHistory]: "Sem histórico para verificar o desconto",
  [PromotionVerdict.NoRealDiscount]: "Sem desconto real face aos 30 dias anteriores",
  [PromotionVerdict.InflatedReference]: "Preço de referência inflacionado",
  [PromotionVerdict.Genuine]: "Desconto verdadeiro",
};

export const PromotionPattern = {
  InsufficientHistory: 0,
  Never: 1,
  Rare: 2,
  Occasional: 3,
  Frequent: 4,
  AlmostAlways: 5,
} as const;
export type PromotionPattern = (typeof PromotionPattern)[keyof typeof PromotionPattern];

export const promotionPatternLabels: Record<PromotionPattern, string> = {
  [PromotionPattern.InsufficientHistory]: "Histórico insuficiente",
  [PromotionPattern.Never]: "Nunca em promoção",
  [PromotionPattern.Rare]: "Raramente em promoção",
  [PromotionPattern.Occasional]: "Em promoção de vez em quando",
  [PromotionPattern.Frequent]: "Em promoção com frequência",
  [PromotionPattern.AlmostAlways]: "Quase sempre em promoção",
};

/** Promoção sem cartão contra o mínimo dos 30 dias anteriores (Diretiva Omnibus). */
export interface PromotionCheckDto {
  promotionId: string;
  announcedDiscountPercent: number | null;
  priceBefore: number | null;
  lowest30Days: number | null;
  realDiscountPercent: number | null;
  verdict: PromotionVerdict;
}

/** Semanas ISO observadas em promoção; descreve o passado, não prevê. */
export interface PromotionFrequencyDto {
  pattern: PromotionPattern;
  weeksObserved: number;
  weeksOnPromotion: number;
  completePromotions: number;
  typicalIntervalDays: number | null;
  since: string | null;
  windowDays: number;
}

/** O último preço contra o histórico da própria oferta. Estatísticas a null com InsufficientHistory. */
export interface PriceInsightDto {
  label: PriceLabel;
  current: number;
  lowest: number | null;
  highest: number | null;
  average: number | null;
  observationCount: number;
  since: string | null;
  windowDays: number;
  promotionCheck: PromotionCheckDto | null;
  promotionFrequency: PromotionFrequencyDto;
}

export interface ProductStoreOfferDto {
  storeOfferId: string;
  storeId: string;
  storeName: string;
  chainId: string;
  chainName: string;
  availability: StoreOfferAvailability;
  latestPrice: PriceObservationDto | null;
  unitPrice: UnitPriceDto | null;
  cardPrice: CardPriceDto | null;
  priceInsight: PriceInsightDto | null;
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
  /** Percentagem anunciada, quando a Api a conhece (null fora de PercentageOff, em geral). */
  discountPercent: number | null;
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

export const DishType = {
  MainCourse: 0,
  Soup: 1,
  Starter: 2,
  SideDish: 3,
  Salad: 4,
  Dessert: 5,
  Breakfast: 6,
  Snack: 7,
  Drink: 8,
  Sauce: 9,
  Preserve: 10,
  Other: 11,
} as const;
export type DishType = (typeof DishType)[keyof typeof DishType];

export const dishTypeLabels: Record<DishType, string> = {
  [DishType.MainCourse]: "Prato principal",
  [DishType.Soup]: "Sopa",
  [DishType.Starter]: "Entrada",
  [DishType.SideDish]: "Acompanhamento",
  [DishType.Salad]: "Salada",
  [DishType.Dessert]: "Sobremesa",
  [DishType.Breakfast]: "Pequeno-almoço",
  [DishType.Snack]: "Lanche",
  [DishType.Drink]: "Bebida",
  [DishType.Sauce]: "Molho",
  [DishType.Preserve]: "Conserva",
  [DishType.Other]: "Outro",
};

export const MainProtein = {
  Meat: 0,
  Fish: 1,
  Seafood: 2,
  Vegetarian: 3,
} as const;
export type MainProtein = (typeof MainProtein)[keyof typeof MainProtein];

export const mainProteinLabels: Record<MainProtein, string> = {
  [MainProtein.Meat]: "Carne",
  [MainProtein.Fish]: "Peixe",
  [MainProtein.Seafood]: "Marisco",
  [MainProtein.Vegetarian]: "Vegetariano",
};

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

/** Como a classificação (dishType/mainProtein) foi obtida. */
export const ClassificationSource = {
  Mapped: 0,
  Inferred: 1,
  Reviewed: 2,
} as const;
export type ClassificationSource = (typeof ClassificationSource)[keyof typeof ClassificationSource];

/** Os nomes que a query string de GET /recipes aceita (`dishType=`, `mainProtein=`). */
export const dishTypeNames: Record<DishType, string> = {
  [DishType.MainCourse]: "MainCourse",
  [DishType.Soup]: "Soup",
  [DishType.Starter]: "Starter",
  [DishType.SideDish]: "SideDish",
  [DishType.Salad]: "Salad",
  [DishType.Dessert]: "Dessert",
  [DishType.Breakfast]: "Breakfast",
  [DishType.Snack]: "Snack",
  [DishType.Drink]: "Drink",
  [DishType.Sauce]: "Sauce",
  [DishType.Preserve]: "Preserve",
  [DishType.Other]: "Other",
};
export const mainProteinNames: Record<MainProtein, string> = {
  [MainProtein.Meat]: "Meat",
  [MainProtein.Fish]: "Fish",
  [MainProtein.Seafood]: "Seafood",
  [MainProtein.Vegetarian]: "Vegetarian",
};

export interface RecipeSummaryDto {
  recipeId: string;
  ownerHouseholdId: string | null;
  title: string;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  tags: string[];
  sourceUrl: string | null;
  sourceCategory: string | null;
  dishType: DishType | null;
  mainProtein: MainProtein | null;
  classificationSource: ClassificationSource | null;
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
  sourceUrl: string | null;
  sourceCategory: string | null;
  dishType: DishType | null;
  mainProtein: MainProtein | null;
  classificationSource: ClassificationSource | null;
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
