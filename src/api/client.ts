import {
  dishTypeNames,
  mainProteinNames,
  type CategoryDto,
  type DishType,
  type DomainEventLogEntryDto,
  type MainProtein,
  type PagedResult,
  type ProductDto,
  type ProductStoreOfferDto,
  type PromotionDto,
  type RecipeDto,
  type RecipeSummaryDto,
} from "./types";
import { send, type QueryParams } from "./http";

function get<T>(path: string, params: QueryParams = {}): Promise<T> {
  return send<T>(path, { params });
}

export function searchProducts(
  search: string,
  page = 1,
  pageSize = 20,
  categoryId?: string,
): Promise<PagedResult<ProductDto>> {
  return get<PagedResult<ProductDto>>("/products", { search, categoryId, page, pageSize });
}

export function getCategories(hasProducts?: boolean): Promise<CategoryDto[]> {
  return get<CategoryDto[]>("/categories", { hasProducts });
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

export interface RecipeFilters {
  dishType?: DishType;
  mainProtein?: MainProtein;
}

export function searchRecipes(
  search: string,
  page = 1,
  pageSize = 20,
  filters: RecipeFilters = {},
): Promise<PagedResult<RecipeSummaryDto>> {
  return get<PagedResult<RecipeSummaryDto>>("/recipes", {
    search,
    page,
    pageSize,
    dishType: filters.dishType === undefined ? undefined : dishTypeNames[filters.dishType],
    mainProtein: filters.mainProtein === undefined ? undefined : mainProteinNames[filters.mainProtein],
  });
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
