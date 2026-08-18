import type {
  CategoryDto,
  DomainEventLogEntryDto,
  PagedResult,
  ProductDto,
  ProductStoreOfferDto,
  PromotionDto,
  RecipeDto,
  RecipeSummaryDto,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL não está definida — ver .env.example.");
}

async function get<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ao pedir ${url.pathname}${url.search}`);
  }

  return (await response.json()) as T;
}

export function searchProducts(
  search: string,
  page = 1,
  pageSize = 20,
  categoryId?: string,
): Promise<PagedResult<ProductDto>> {
  return get<PagedResult<ProductDto>>("/products", { search, categoryId, page, pageSize });
}

export function getCategories(): Promise<CategoryDto[]> {
  return get<CategoryDto[]>("/categories");
}

export function getProduct(productId: string): Promise<ProductDto> {
  return get<ProductDto>(`/products/${productId}`);
}

export function getProductStoreOffers(productId: string): Promise<ProductStoreOfferDto[]> {
  return get<ProductStoreOfferDto[]>(`/products/${productId}/store-offers`);
}

export function searchActivePromotions(page = 1, pageSize = 20): Promise<PagedResult<PromotionDto>> {
  return get<PagedResult<PromotionDto>>("/promotions", { activeNow: true, page, pageSize });
}

export function searchRecipes(search: string, page = 1, pageSize = 20): Promise<PagedResult<RecipeSummaryDto>> {
  return get<PagedResult<RecipeSummaryDto>>("/recipes", { search, page, pageSize });
}

export function getRecipe(recipeId: string): Promise<RecipeDto> {
  return get<RecipeDto>(`/recipes/${recipeId}`);
}

export function getEvents(aggregateType: string, aggregateId: string): Promise<DomainEventLogEntryDto[]> {
  return get<DomainEventLogEntryDto[]>("/events", { aggregateType, aggregateId });
}

export function getPromotion(promotionId: string): Promise<PromotionDto> {
  return get<PromotionDto>(`/promotions/${promotionId}`);
}
