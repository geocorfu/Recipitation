import type { CATEGORIES, UNITS } from "./constants";

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];

/** Scale or jug equivalent of a cup/glass/spoon measure, filled by Claude. */
export interface Metric {
  amount: number;
  unit: "g" | "ml";
  estimated: boolean;
}

export interface Ingredient {
  quantity: number | null;
  unit: Unit | null;
  name: string;
  note: string | null;
  /** The line exactly as the source wrote it. This is what the page shows. */
  text: string;
  metric: Metric | null;
}

export interface IngredientGroup {
  group: string | null;
  items: Ingredient[];
}

export interface StepGroup {
  group: string | null;
  items: string[];
}

/** Everything a recipe holds, in the shape that is pasted in and exported. */
export interface RecipeData {
  title: string;
  category: Category;
  tags: string[];
  from_person: string | null;
  servings: number | null;
  yield: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  ingredients: IngredientGroup[];
  steps: StepGroup[];
  notes: string | null;
  source_url: string | null;
  image_url: string | null;
}

/** A recipe read from a paste: id decides replace vs. new, warnings are shown but never saved. */
export interface PastedRecipe extends RecipeData {
  id: string | null;
  warnings: string[];
}

export interface Recipe extends RecipeData {
  id: string;
  search_text: string;
  created_at: string;
  updated_at: string;
}

export type RecipeSummary = Pick<
  Recipe,
  "id" | "title" | "category" | "from_person" | "prep_minutes" | "cook_minutes" | "image_url" | "search_text"
>;
