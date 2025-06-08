import { CuisineOption, DietaryRestrictionOption, CookingTimeOption } from './types';

export const API_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const RECIPE_COUNT = 3;

export const CUISINE_OPTIONS: CuisineOption[] = Object.values(CuisineOption);
export const DIETARY_RESTRICTION_OPTIONS: DietaryRestrictionOption[] = Object.values(DietaryRestrictionOption);
export const COOKING_TIME_OPTIONS: CookingTimeOption[] = Object.values(CookingTimeOption);

export const DEFAULT_SERVINGS = 2;
export const LOCAL_STORAGE_FAVORITES_KEY = 'pantryChefAIFavorites';
export const ARTICLE_AUTHOR_NAME = "NATTHAPONG PURENTE";
