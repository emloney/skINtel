-- ============================================================================
-- Row-level security for scan_history
-- Run this in Supabase Dashboard → SQL Editor
--
-- The products page records each analysis here (product name, safety score,
-- number of flags). Without these policies the write is silently skipped and
-- analysis still works — this just enables the saved "scan history".
-- ============================================================================

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own scans"   ON public.scan_history;
DROP POLICY IF EXISTS "Users can insert own scans" ON public.scan_history;

CREATE POLICY "Users can read own scans"
ON public.scan_history FOR SELECT TO authenticated
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own scans"
ON public.scan_history FOR INSERT TO authenticated
WITH CHECK ( auth.uid() = user_id );
