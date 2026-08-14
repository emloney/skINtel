-- ============================================================================
-- community_flags: reaction reports + missing-product submissions
-- Run this in Supabase Dashboard → SQL Editor
--
-- ⚠️ SECURITY: this table currently has NO row-level security, so anyone with
-- the public anon key can insert AND delete rows. This script closes that.
-- Run it even if you don't use the reporting feature.
-- ============================================================================

-- ─── 1. Columns the app needs ───────────────────────────────────────────────
-- The original table only supported "here's a product we're missing".
-- Reaction reports also need: who reported, what happened, and which kind.
ALTER TABLE public.community_flags
  ADD COLUMN IF NOT EXISTS user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS note        text,
  ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'reaction';

-- Existing rows (if any) predate report_type; treat them as product submissions.
UPDATE public.community_flags SET report_type = 'missing_product' WHERE report_type IS NULL;

-- ─── 2. Lock the table down ─────────────────────────────────────────────────
ALTER TABLE public.community_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit own flags" ON public.community_flags;
DROP POLICY IF EXISTS "Users can read own flags"   ON public.community_flags;

-- Signed-in users may submit a report, attributed to themselves.
CREATE POLICY "Users can submit own flags"
ON public.community_flags
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- Users can see the reports they submitted (moderation happens in the
-- dashboard; no UPDATE/DELETE policy means nobody can edit or remove them).
CREATE POLICY "Users can read own flags"
ON public.community_flags
FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- ============================================================================
-- After running:
--   • Anonymous insert/delete is blocked (the security hole is closed)
--   • The app can submit reaction reports from the analysis panel
--   • Review submissions in Table Editor → community_flags (status = 'pending')
-- ============================================================================
