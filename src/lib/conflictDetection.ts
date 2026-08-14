/**
 * Ingredient Conflict Detection
 *
 * Given a list of products on a user's shelf, checks whether any two products
 * contain ingredients that shouldn't be combined in the same routine.
 *
 * This is a pure function with no side effects — takes shelf products +
 * conflict rules in, returns conflicts out. Easy to unit test.
 */

import { supabase } from "./supabaseClient"; // adjust path to your existing client

export interface ShelfProduct {
  id: number;
  product_name: string;
  ingredients_parsed: string[]; // already an array of ingredient names
}

export interface ConflictRule {
  id: number;
  ingredient_a: string;
  ingredient_b: string;
  severity: "mild" | "moderate" | "severe";
  reason: string;
  advice: string | null;
}

export interface DetectedConflict {
  productA: ShelfProduct;
  productB: ShelfProduct;
  ingredientA: string;
  ingredientB: string;
  severity: "mild" | "moderate" | "severe";
  reason: string;
  advice: string | null;
}

/**
 * Fetches all conflict rules from Supabase once, so we don't hit the DB
 * for every check.
 */
export async function fetchConflictRules(): Promise<ConflictRule[]> {
  const { data, error } = await supabase.from("ingredient_conflicts").select("*");
  if (error) {
    console.error("Failed to load conflict rules:", error.message);
    return [];
  }
  return (data ?? []) as ConflictRule[];
}

/**
 * Normalises an ingredient string for matching (lowercase, trim).
 * Extend this later with alias handling if needed.
 */
function normalise(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Checks whether the given ingredient list contains a match for the target.
 * Uses a "contains" check so "Ascorbic Acid (Vitamin C)" matches "vitamin c".
 */
function ingredientListContains(ingredients: string[], target: string): boolean {
  const t = normalise(target);
  return ingredients.some((ing) => normalise(ing).includes(t));
}

/**
 * The main detection function. Loops through every unique pair of products
 * on the shelf and checks against every conflict rule.
 *
 * For a shelf of N products, this checks N * (N-1) / 2 pairs — fine for
 * small shelves (up to maybe 20 products before you'd want to optimise).
 */
export function detectConflicts(
  shelfProducts: ShelfProduct[],
  rules: ConflictRule[]
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  for (let i = 0; i < shelfProducts.length; i++) {
    for (let j = i + 1; j < shelfProducts.length; j++) {
      const productA = shelfProducts[i];
      const productB = shelfProducts[j];

      for (const rule of rules) {
        // Check both directions: A→B and B→A (rules don't care about order)
        const aHasIngredientA = ingredientListContains(productA.ingredients_parsed, rule.ingredient_a);
        const bHasIngredientB = ingredientListContains(productB.ingredients_parsed, rule.ingredient_b);
        const aHasIngredientB = ingredientListContains(productA.ingredients_parsed, rule.ingredient_b);
        const bHasIngredientA = ingredientListContains(productB.ingredients_parsed, rule.ingredient_a);

        if ((aHasIngredientA && bHasIngredientB) || (aHasIngredientB && bHasIngredientA)) {
          conflicts.push({
            productA,
            productB,
            ingredientA: rule.ingredient_a,
            ingredientB: rule.ingredient_b,
            severity: rule.severity,
            reason: rule.reason,
            advice: rule.advice,
          });
        }
      }
    }
  }

  return conflicts;
}
