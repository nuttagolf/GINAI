export interface RecipeIngredient {
  name: string;
  quantity: string;
  notes?: string;
}

export interface Recipe {
  name:string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  cuisine: string;
  caloriesPerServing: number;
  imageUrl?: string; // Added for generated image URL
}

export interface Preferences {
  pantryItems: string[];
  cuisine: string; 
  dietaryRestrictions: string[]; 
  servings: number;
  cookingTime: string; 
}

export enum CuisineOption {
  ANY = "อาหารทุกประเภท",
  THAI = "อาหารไทย (ทั่วไป)", // Clarified general Thai
  NORTHERN_THAI = "อาหารภาคเหนือ",
  NORTHEASTERN_THAI = "อาหารภาคอีสาน",
  CENTRAL_THAI = "อาหารภาคกลาง",
  SOUTHERN_THAI = "อาหารภาคใต้",
  ITALIAN = "อาหารอิตาเลียน",
  MEXICAN = "อาหารเม็กซิกัน",
  INDIAN = "อาหารอินเดีย",
  CHINESE = "อาหารจีน",
  JAPANESE = "อาหารญี่ปุ่น",
  FRENCH = "อาหารฝรั่งเศส",
  AMERICAN = "อาหารอเมริกัน",
  MEDITERRANEAN = "อาหารเมดิเตอร์เรเนียน",
  KOREAN = "อาหารเกาหลี",
}

export enum DietaryRestrictionOption {
  VEGETARIAN = "มังสวิรัติ",
  VEGAN = "วีแกน",
  GLUTEN_FREE = "ปลอดกลูเตน",
  DAIRY_FREE = "ปลอดผลิตภัณฑ์จากนม",
  NUT_FREE = "ปลอดถั่ว",
}

export enum CookingTimeOption {
  ANY = "ไม่จำกัดเวลา",
  UNDER_30 = "< 30 นาที",
  BETWEEN_30_60 = "30-60 นาที",
  OVER_60 = "> 1 ชั่วโมง",
}

export interface HealthArticle {
  title: string;
  summary: string;
  paragraphs: string[];
  keywords: string[]; // For potential SEO or ad targeting
}