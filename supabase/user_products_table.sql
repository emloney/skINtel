-- ============================================================================
-- Per-user shelf: which catalog products a user has saved
-- Run this in Supabase Dashboard → SQL Editor
-- (The catalog itself is the existing indian_products table.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    NOT NULL REFERENCES public.users(id)           ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES public.indian_products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own shelf"        ON public.user_products;
DROP POLICY IF EXISTS "Users can add to own shelf"      ON public.user_products;
DROP POLICY IF EXISTS "Users can remove from own shelf" ON public.user_products;

CREATE POLICY "Users can read own shelf"
ON public.user_products FOR SELECT TO authenticated
USING ( auth.uid() = user_id );

CREATE POLICY "Users can add to own shelf"
ON public.user_products FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can remove from own shelf"
ON public.user_products FOR DELETE TO authenticated
USING ( auth.uid() = user_id );

-- Optional: speeds up the type-ahead search on the catalog as it grows.
-- Safe to run — no effect on existing data.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS indian_products_name_trgm_idx
  ON public.indian_products USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS indian_products_brand_trgm_idx
  ON public.indian_products USING gin (brand gin_trgm_ops);
