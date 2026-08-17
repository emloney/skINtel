import { supabase } from './supabaseClient';

/**
 * Barcode lookup: the catalog first, then Open Beauty Facts as a fallback.
 *
 * The catalog's `barcode` column starts out empty, so most scans miss at first.
 * Open Beauty Facts is a free, open cosmetics database (sister project to Open
 * Food Facts) that fills the gap, and users can attach barcodes to catalog
 * products as they go.
 */

export interface CatalogMatch {
  source: 'catalog';
  id: number;
  brand: string;
  product_name: string;
  product_type: string | null;
  ingredients_parsed: string[] | null;
}

export interface ExternalMatch {
  source: 'openbeautyfacts';
  barcode: string;
  brand: string;
  product_name: string;
  ingredients: string[];
  imageUrl: string | null;
}

export type BarcodeResult = CatalogMatch | ExternalMatch | { source: 'none'; barcode: string };

/** Barcodes are digits; strip anything a scanner might tack on. */
export function normalizeBarcode(raw: string): string {
  return String(raw).replace(/\D/g, '');
}

/**
 * Open Beauty Facts returns ingredients either as a parsed array or as one
 * comma-separated string, depending on how the product was contributed.
 */
function parseIngredients(product: {
  ingredients?: { text?: string }[];
  ingredients_text?: string;
}): string[] {
  if (Array.isArray(product.ingredients) && product.ingredients.length > 0) {
    const fromArray = product.ingredients
      .map((i) => (i?.text ?? '').trim())
      .filter(Boolean);
    if (fromArray.length > 0) return fromArray;
  }
  const text = product.ingredients_text ?? '';
  return text
    .split(/[,;]/)
    .map((s) => s.replace(/[.*_]/g, '').trim())
    .filter((s) => s.length > 1);
}

async function lookupCatalog(barcode: string): Promise<CatalogMatch | null> {
  const { data, error } = await supabase
    .from('indian_products')
    .select('id, brand, product_name, product_type, ingredients_parsed')
    .eq('barcode', barcode)
    .maybeSingle();
  if (error || !data) return null;
  return { source: 'catalog', ...data } as CatalogMatch;
}

async function lookupOpenBeautyFacts(barcode: string): Promise<ExternalMatch | null> {
  // Public read-only API, no key required.
  const url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,ingredients,ingredients_text,image_front_small_url`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const ingredients = parseIngredients(p);
    const name = (p.product_name ?? '').trim();
    if (!name && ingredients.length === 0) return null;

    return {
      source: 'openbeautyfacts',
      barcode,
      brand: (p.brands ?? '').split(',')[0].trim() || 'Unknown brand',
      product_name: name || 'Unnamed product',
      ingredients,
      imageUrl: p.image_front_small_url ?? null,
    };
  } catch {
    // Offline, blocked, or CORS — treat as simply "not found".
    return null;
  }
}

export async function lookupBarcode(rawBarcode: string): Promise<BarcodeResult> {
  const barcode = normalizeBarcode(rawBarcode);
  if (!barcode) return { source: 'none', barcode: rawBarcode };

  const fromCatalog = await lookupCatalog(barcode);
  if (fromCatalog) return fromCatalog;

  const external = await lookupOpenBeautyFacts(barcode);
  if (external) return external;

  return { source: 'none', barcode };
}

/**
 * Attach a scanned barcode to a catalog product, so the next scan matches
 * instantly. The RLS policy only permits this while the product's barcode is
 * still empty, so existing links can't be overwritten.
 */
export async function linkBarcodeToProduct(
  productId: number,
  rawBarcode: string,
  userId: string
): Promise<void> {
  const barcode = normalizeBarcode(rawBarcode);
  if (!barcode) throw new Error('That barcode looks empty.');

  const { error } = await supabase
    .from('indian_products')
    .update({ barcode })
    .eq('id', productId)
    .is('barcode', null);
  if (error) throw error;

  // Best-effort audit trail; never block the user on it.
  supabase
    .from('barcode_submissions')
    .insert({ user_id: userId, product_id: productId, barcode })
    .then(({ error: logErr }) => {
      if (logErr) console.warn('barcode_submissions log skipped:', logErr.message);
    });
}
