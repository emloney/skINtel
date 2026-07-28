import { supabase } from './supabaseClient';

// ─── DB row shapes ───────────────────────────────────────────────────────────

interface HarmfulRow {
  name: string;
  aliases: string[] | null;
  risk_level: RiskLevel;
  category: string | null;
  what_it_does: string | null;
  health_concern: string | null;
  safer_alternative: string | null;
  pregnancy_flag: boolean | null;
}

interface BannedRow {
  ingredient_name: string;
  aliases: string[] | null;
  reason: string | null;
}

interface AyurvedicRow {
  indian_name: string;
  inci_name: string | null;
  aliases: string[] | null;
  benefit: string | null;
  skin_type_notes: string | null;
}

// ─── Public types ────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';
export type ScoreBand = 'excellent' | 'good' | 'caution' | 'avoid';

export interface Flag {
  ingredient: string; // as it appears on the product
  matched: string; // canonical harmful_ingredients.name
  riskLevel: RiskLevel;
  category: string | null;
  concern: string | null;
  saferAlternative: string | null;
  pregnancyFlag: boolean;
  personal: string | null; // why it matters for THIS user, if it does
}

export interface BannedHit {
  ingredient: string;
  matched: string;
  reason: string | null;
}

export interface Beneficial {
  ingredient: string;
  matched: string;
  benefit: string | null;
}

export interface UserProfile {
  skinType?: string | null;
  skinConcerns?: string[] | null;
  allergies?: string[] | null;
  isPregnant?: boolean | null;
}

export interface AnalysisResult {
  score: number; // 0–100
  band: ScoreBand;
  totalIngredients: number;
  flags: Flag[];
  banned: BannedHit[];
  beneficial: Beneficial[];
  personalNotes: string[];
}

export interface ReferenceData {
  harmful: HarmfulRow[];
  banned: BannedRow[];
  ayurvedic: AyurvedicRow[];
}

// ─── Normalization ───────────────────────────────────────────────────────────

/** Lowercase, strip zero-width chars, collapse whitespace. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Ricinus Communis (Castor Seed Oil)" → "ricinus communis" */
function stripParenthetical(s: string): string {
  return norm(s.replace(/\([^)]*\)/g, ''));
}

/** The set of normalized keys an ingredient string should be looked up under. */
function lookupKeys(ingredient: string): string[] {
  const keys = new Set<string>();
  const full = norm(ingredient);
  if (full) keys.add(full);
  const stripped = stripParenthetical(ingredient);
  if (stripped) keys.add(stripped);
  return [...keys];
}

// Generic index: normalized alias/name → canonical record
function buildIndex<T>(rows: T[], names: (row: T) => string[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const row of rows) {
    for (const n of names(row)) {
      const key = norm(n);
      if (key && !index.has(key)) index.set(key, row);
    }
  }
  return index;
}

// ─── Reference data (fetched once, cached for the session) ───────────────────

let cache: ReferenceData | null = null;

export async function loadReferenceData(): Promise<ReferenceData> {
  if (cache) return cache;
  const [harmful, banned, ayurvedic] = await Promise.all([
    supabase
      .from('harmful_ingredients')
      .select('name, aliases, risk_level, category, what_it_does, health_concern, safer_alternative, pregnancy_flag'),
    supabase.from('cdsco_banned').select('ingredient_name, aliases, reason'),
    supabase.from('ayurvedic_ingredients').select('indian_name, inci_name, aliases, benefit, skin_type_notes'),
  ]);

  if (harmful.error) throw harmful.error;
  // Banned/ayurvedic are enrichment — if either is missing or empty, analysis
  // still works, so don't hard-fail on them.
  cache = {
    harmful: (harmful.data as HarmfulRow[]) ?? [],
    banned: (banned.data as BannedRow[]) ?? [],
    ayurvedic: (ayurvedic.data as AyurvedicRow[]) ?? [],
  };
  return cache;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

const RISK_PENALTY: Record<RiskLevel, number> = { high: 18, medium: 9, low: 3 };
const BANNED_PENALTY = 40;

function bandFor(score: number, hasBanned: boolean): ScoreBand {
  if (hasBanned) return 'avoid';
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'caution';
  return 'avoid';
}

// ─── Analysis (pure) ─────────────────────────────────────────────────────────

const IRRITANT_CATEGORIES = new Set(['irritant', 'allergen', 'sensitizer']);

export function analyzeIngredients(
  ingredients: string[],
  ref: ReferenceData,
  profile: UserProfile = {}
): AnalysisResult {
  const harmfulIndex = buildIndex(ref.harmful, (r) => [r.name, ...(r.aliases ?? [])]);
  const bannedIndex = buildIndex(ref.banned, (r) => [r.ingredient_name, ...(r.aliases ?? [])]);
  const ayurIndex = buildIndex(ref.ayurvedic, (r) =>
    [r.indian_name, r.inci_name ?? '', ...(r.aliases ?? [])].filter(Boolean)
  );

  const sensitive = norm(profile.skinType ?? '') === 'sensitive';
  const isPregnant = !!profile.isPregnant;
  const allergyKeys = new Set((profile.allergies ?? []).map(norm).filter(Boolean));

  const flags: Flag[] = [];
  const banned: BannedHit[] = [];
  const beneficial: Beneficial[] = [];
  const seenHarmful = new Set<string>();
  const seenBanned = new Set<string>();
  const seenBeneficial = new Set<string>();

  for (const raw of ingredients) {
    if (!raw || !String(raw).trim()) continue;
    const keys = lookupKeys(String(raw));

    // Banned takes priority — most severe.
    for (const key of keys) {
      const hit = bannedIndex.get(key);
      if (hit && !seenBanned.has(hit.ingredient_name)) {
        seenBanned.add(hit.ingredient_name);
        banned.push({ ingredient: String(raw).trim(), matched: hit.ingredient_name, reason: hit.reason });
        break;
      }
    }

    for (const key of keys) {
      const hit = harmfulIndex.get(key);
      if (hit && !seenHarmful.has(hit.name)) {
        seenHarmful.add(hit.name);
        let personal: string | null = null;
        if (sensitive && hit.category && IRRITANT_CATEGORIES.has(norm(hit.category))) {
          personal = 'Your sensitive skin may be more likely to react to this.';
        }
        if (isPregnant && hit.pregnancy_flag) {
          personal = 'Often advised against during pregnancy — check with your doctor.';
        }
        flags.push({
          ingredient: String(raw).trim(),
          matched: hit.name,
          riskLevel: hit.risk_level,
          category: hit.category,
          concern: hit.health_concern,
          saferAlternative: hit.safer_alternative,
          pregnancyFlag: !!hit.pregnancy_flag,
          personal,
        });
        break;
      }
    }

    for (const key of keys) {
      // Personal allergen match (from the user's own allergy list)
      if (allergyKeys.has(key)) {
        banned.push({
          ingredient: String(raw).trim(),
          matched: String(raw).trim(),
          reason: "You listed this as a personal allergen.",
        });
      }
      const good = ayurIndex.get(key);
      if (good && !seenBeneficial.has(good.indian_name)) {
        seenBeneficial.add(good.indian_name);
        beneficial.push({
          ingredient: String(raw).trim(),
          matched: good.inci_name || good.indian_name,
          benefit: good.benefit,
        });
        break;
      }
    }
  }

  // Score
  let score = 100;
  for (const f of flags) score -= RISK_PENALTY[f.riskLevel];
  score -= banned.length * BANNED_PENALTY;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandFor(score, banned.length > 0);

  // Top-level personalized notes
  const personalNotes: string[] = [];
  const highCount = flags.filter((f) => f.riskLevel === 'high').length;
  if (sensitive) {
    const irritants = flags.filter((f) => f.category && IRRITANT_CATEGORIES.has(norm(f.category))).length;
    if (irritants > 0) {
      personalNotes.push(
        `You told us your skin is sensitive — this product has ${irritants} ingredient${
          irritants > 1 ? 's' : ''
        } that can trigger irritation.`
      );
    }
  }
  if (isPregnant) {
    const preg = flags.filter((f) => f.pregnancyFlag).length;
    if (preg > 0) {
      personalNotes.push(
        `${preg} ingredient${preg > 1 ? 's are' : ' is'} commonly flagged during pregnancy.`
      );
    }
  }
  if (beneficial.length > 0 && highCount === 0 && banned.length === 0) {
    personalNotes.push(
      `On the bright side, it contains ${beneficial.length} skin-friendly ingredient${
        beneficial.length > 1 ? 's' : ''
      }.`
    );
  }

  return {
    score,
    band,
    totalIngredients: ingredients.filter((i) => i && String(i).trim()).length,
    flags: flags.sort((a, b) => RISK_PENALTY[b.riskLevel] - RISK_PENALTY[a.riskLevel]),
    banned,
    beneficial,
    personalNotes,
  };
}

// ─── Convenience: load + analyze ─────────────────────────────────────────────

export async function analyzeProduct(
  ingredients: string[],
  profile: UserProfile = {}
): Promise<AnalysisResult> {
  const ref = await loadReferenceData();
  return analyzeIngredients(ingredients, ref, profile);
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  excellent: 'Great choice',
  good: 'Looks good',
  caution: 'Use with caution',
  avoid: 'Better to avoid',
};

// ─── AI chat (via the summarize-analysis Edge Function) ──────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Ask the Edge Function about an analysis result. With an empty `messages`
 * array it returns the opening summary; with a conversation it returns the next
 * reply, keeping the product, ingredients, and profile in context.
 *
 * This is a bonus layer — callers should treat failure as non-fatal and still
 * show the deterministic findings. The Gemini key lives server-side in the
 * function, never in this bundle.
 */
export async function askAnalysis(input: {
  productName: string;
  result: AnalysisResult;
  profile: UserProfile;
  messages: ChatMessage[];
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke('summarize-analysis', {
    body: input,
  });
  if (error) throw error;
  const reply = (data as { reply?: string } | null)?.reply;
  if (!reply) throw new Error('No reply was returned.');
  return reply;
}
