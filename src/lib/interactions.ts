// Deterministic routine (product-combination) analysis and teen/tween safety.
// No external data needed — these are well-established skincare-layering rules.

// ─── Normalization ───────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Active ingredient classes ───────────────────────────────────────────────

export type ActiveClass =
  | 'retinoid'
  | 'aha'
  | 'bha'
  | 'vitamin_c'
  | 'benzoyl_peroxide'
  | 'niacinamide';

export const CLASS_LABEL: Record<ActiveClass, string> = {
  retinoid: 'Retinoid',
  aha: 'AHA (exfoliating acid)',
  bha: 'BHA (salicylic acid)',
  vitamin_c: 'Vitamin C',
  benzoyl_peroxide: 'Benzoyl peroxide',
  niacinamide: 'Niacinamide',
};

// Ingredient-name fragments that identify each class. Matched as substrings of
// the normalized ingredient, so "Salicylic Acid (BHA)" still matches.
const CLASS_PATTERNS: Record<ActiveClass, string[]> = {
  retinoid: [
    'retinol',
    'retinal',
    'retinaldehyde',
    'retinyl palmitate',
    'retinyl acetate',
    'retinyl retinoate',
    'tretinoin',
    'retinoic acid',
    'adapalene',
    'hydroxypinacolone retinoate',
    'granactive retinoid',
  ],
  // citric acid is deliberately excluded — it's usually a pH adjuster, not an exfoliant.
  aha: ['glycolic acid', 'lactic acid', 'mandelic acid', 'malic acid', 'tartaric acid', 'ammonium lactate'],
  bha: ['salicylic acid', 'betaine salicylate', 'salix', 'willow bark'],
  vitamin_c: [
    'ascorbic acid',
    'ascorbyl glucoside',
    'ascorbyl phosphate',
    'ascorbyl palmitate',
    'ethyl ascorbic acid',
    'tetrahexyldecyl ascorbate',
  ],
  benzoyl_peroxide: ['benzoyl peroxide'],
  niacinamide: ['niacinamide', 'nicotinamide'],
};

/** The set of active classes found in a product's ingredient list. */
export function classifyProduct(ingredients: string[]): Set<ActiveClass> {
  const found = new Set<ActiveClass>();
  const normed = (ingredients || []).map((i) => norm(String(i)));
  (Object.keys(CLASS_PATTERNS) as ActiveClass[]).forEach((cls) => {
    if (CLASS_PATTERNS[cls].some((p) => normed.some((ing) => ing.includes(p)))) {
      found.add(cls);
    }
  });
  return found;
}

// ─── Layering interaction rules ──────────────────────────────────────────────

export type Severity = 'high' | 'moderate' | 'low';

interface InteractionRule {
  a: ActiveClass;
  b: ActiveClass;
  severity: Severity;
  title: string;
  message: string;
  advice: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  {
    a: 'retinoid',
    b: 'aha',
    severity: 'moderate',
    title: 'Retinoid + exfoliating acid',
    message: 'Using a retinoid and an AHA together can over-irritate skin — redness, dryness and peeling.',
    advice: 'Use them on alternate nights, or acid in the morning and retinoid at night.',
  },
  {
    a: 'retinoid',
    b: 'bha',
    severity: 'moderate',
    title: 'Retinoid + salicylic acid',
    message: 'Layering a retinoid with a BHA can strip and irritate the skin barrier.',
    advice: 'Alternate nights, or keep one for morning and one for evening.',
  },
  {
    a: 'retinoid',
    b: 'benzoyl_peroxide',
    severity: 'high',
    title: 'Retinoid + benzoyl peroxide',
    message: 'Benzoyl peroxide can deactivate some retinoids and the pair is very drying together.',
    advice: 'Use benzoyl peroxide in the morning and the retinoid at night, or on different days.',
  },
  {
    a: 'retinoid',
    b: 'vitamin_c',
    severity: 'low',
    title: 'Retinoid + vitamin C',
    message: 'Both are potent actives; used together they can be more irritating than helpful.',
    advice: 'A classic split works well: vitamin C in the morning, retinoid at night.',
  },
  {
    a: 'vitamin_c',
    b: 'aha',
    severity: 'moderate',
    title: 'Vitamin C + exfoliating acid',
    message: 'Combining vitamin C with an AHA can lower its stability and increase irritation.',
    advice: 'Apply them at different times of day.',
  },
  {
    a: 'benzoyl_peroxide',
    b: 'aha',
    severity: 'moderate',
    title: 'Benzoyl peroxide + exfoliating acid',
    message: 'Both are drying; together they can over-exfoliate and inflame the skin.',
    advice: 'Space them out — different times of day or alternate days.',
  },
  {
    a: 'aha',
    b: 'bha',
    severity: 'low',
    title: 'Multiple exfoliating acids',
    message: 'Stacking an AHA and a BHA daily can compromise the skin barrier over time.',
    advice: 'Limit to a few times a week and not both on the same day.',
  },
];

export interface RoutineConflict {
  severity: Severity;
  title: string;
  message: string;
  advice: string;
  products: string[]; // product names involved
}

export interface RoutineProduct {
  name: string;
  classes: ActiveClass[];
}

export interface RoutineResult {
  conflicts: RoutineConflict[];
  products: RoutineProduct[];
  activeClassCount: number;
}

/** Analyze a set of products for risky active-ingredient layering combos. */
export function analyzeRoutine(products: { name: string; ingredients: string[] }[]): RoutineResult {
  const classified = products.map((p) => ({
    name: p.name,
    set: classifyProduct(p.ingredients),
  }));

  const productsWithClass = (cls: ActiveClass) =>
    classified.filter((p) => p.set.has(cls)).map((p) => p.name);

  const conflicts: RoutineConflict[] = [];
  for (const rule of INTERACTION_RULES) {
    const withA = productsWithClass(rule.a);
    const withB = productsWithClass(rule.b);
    if (withA.length === 0 || withB.length === 0) continue;
    // Skip if the only source of both classes is the exact same single product
    // and nothing else — still worth flagging, so we keep it, but de-dupe names.
    const involved = Array.from(new Set([...withA, ...withB]));
    conflicts.push({
      severity: rule.severity,
      title: rule.title,
      message: rule.message,
      advice: rule.advice,
      products: involved,
    });
  }

  const allClasses = new Set<ActiveClass>();
  classified.forEach((p) => p.set.forEach((c) => allClasses.add(c)));

  const severityRank: Record<Severity, number> = { high: 0, moderate: 1, low: 2 };
  conflicts.sort((x, y) => severityRank[x.severity] - severityRank[y.severity]);

  return {
    conflicts,
    products: classified.map((p) => ({ name: p.name, classes: Array.from(p.set) })),
    activeClassCount: allClasses.size,
  };
}

// ─── Teen / tween safety ─────────────────────────────────────────────────────

export interface TeenWarning {
  ingredient: string; // as it appears on the product
  category: string;
  reason: string;
}

interface TeenRule {
  patterns: string[];
  category: string;
  reason: string;
}

// Ingredients generally not recommended for young (roughly under-18) skin.
// Note: salicylic acid and benzoyl peroxide are intentionally NOT here — they're
// commonly dermatologist-recommended for teen acne.
const TEEN_RULES: TeenRule[] = [
  {
    patterns: CLASS_PATTERNS.retinoid,
    category: 'Anti-aging retinoid',
    reason:
      "Anti-aging retinoids aren't needed for young skin and can cause irritation and sun sensitivity — unless a dermatologist prescribed one for acne.",
  },
  {
    patterns: ['glycolic acid', 'lactic acid', 'mandelic acid'],
    category: 'Strong exfoliating acid',
    reason: 'Strong exfoliating acids can be harsh on young, healthy skin; gentle care is usually better.',
  },
  {
    patterns: ['hydroquinone'],
    category: 'Skin-lightening agent',
    reason: 'A potent skin-lightening agent that is not appropriate for young skin.',
  },
  {
    patterns: ['fragrance', 'parfum', 'essential oil', 'limonene', 'linalool', 'citronellol', 'geraniol'],
    category: 'Fragrance / essential oil',
    reason: 'Fragrances and essential oils are common irritants and can be harsher on sensitive young skin.',
  },
];

/** Ingredients on this product that aren't ideal for teen/tween skin. */
export function teenSafetyCheck(ingredients: string[]): TeenWarning[] {
  const warnings: TeenWarning[] = [];
  const seen = new Set<string>();
  for (const raw of ingredients || []) {
    const ing = norm(String(raw));
    if (!ing) continue;
    for (const rule of TEEN_RULES) {
      if (rule.patterns.some((p) => ing.includes(p))) {
        if (seen.has(rule.category)) break; // one warning per category
        seen.add(rule.category);
        warnings.push({ ingredient: String(raw).trim(), category: rule.category, reason: rule.reason });
        break;
      }
    }
  }
  return warnings;
}
