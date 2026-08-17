-- ============================================================================
-- Barcode scanning support
-- Run this in Supabase Dashboard → SQL Editor
--
-- The catalog has a `barcode` column but every row is empty, so a scan matches
-- nothing. This lets signed-in users attach a barcode to a product they've
-- identified, so the next person who scans it gets an instant match.
-- ============================================================================

-- ─── 1. Fast lookup by barcode ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS indian_products_barcode_idx
  ON public.indian_products (barcode)
  WHERE barcode IS NOT NULL;

-- One product per barcode — stops two products claiming the same code.
CREATE UNIQUE INDEX IF NOT EXISTS indian_products_barcode_uidx
  ON public.indian_products (barcode)
  WHERE barcode IS NOT NULL;

-- ─── 2. Let users fill in a MISSING barcode ─────────────────────────────────
-- The catalog is otherwise read-only. This policy is deliberately narrow:
-- a row can only be touched while its barcode is still NULL, so an existing
-- barcode can never be overwritten or erased through the API.
ALTER TABLE public.indian_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can browse products" ON public.indian_products;
DROP POLICY IF EXISTS "Anyone can read products"            ON public.indian_products;
DROP POLICY IF EXISTS "Users can link a missing barcode"     ON public.indian_products;

-- Keep the catalog readable (the app needs this for search).
CREATE POLICY "Anyone can read products"
ON public.indian_products
FOR SELECT
USING ( true );

CREATE POLICY "Users can link a missing barcode"
ON public.indian_products
FOR UPDATE
TO authenticated
USING ( barcode IS NULL )
WITH CHECK ( barcode IS NOT NULL );

-- ─── 3. Log who linked what (for review / undo) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.barcode_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    NOT NULL REFERENCES public.users(id)           ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES public.indian_products(id) ON DELETE CASCADE,
  barcode    text    NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.barcode_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can log own barcode links" ON public.barcode_submissions;
DROP POLICY IF EXISTS "Users can read own barcode links" ON public.barcode_submissions;

CREATE POLICY "Users can log own barcode links"
ON public.barcode_submissions FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can read own barcode links"
ON public.barcode_submissions FOR SELECT TO authenticated
USING ( auth.uid() = user_id );

-- ============================================================================
-- After running:
--   • Scanning looks products up by barcode instantly
--   • A scan with no match falls back to Open Beauty Facts
--   • If that misses too, the user can attach the barcode to a catalog product
--     and it works for everyone from then on
-- ============================================================================
