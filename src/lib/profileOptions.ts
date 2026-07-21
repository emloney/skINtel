export const AGE_RANGES = ['Under 18', '18-24', '25-34', '35-44', '45+'] as const;
export const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'] as const;
export const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'] as const;
export const HAIR_TYPES = ['Straight', 'Wavy', 'Curly', 'Coily'] as const;
export const SKIN_CONCERNS = [
  'Acne',
  'Pigmentation',
  'Dryness',
  'Anti-aging',
  'Sensitivity',
  'Dark circles',
  'Uneven texture',
] as const;

export type AgeRange = (typeof AGE_RANGES)[number];
export type Gender = (typeof GENDERS)[number];
export type SkinType = (typeof SKIN_TYPES)[number];
export type HairType = (typeof HAIR_TYPES)[number];
export type SkinConcern = (typeof SKIN_CONCERNS)[number];
