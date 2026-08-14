-- ============================================================================
-- FIX: community_flags is still open to anonymous writes
-- Run this in Supabase Dashboard → SQL Editor
--
-- community_flags_setup.sql added the columns, but anonymous INSERT and DELETE
-- still succeed. That means a pre-existing permissive policy (created under a
-- different name) is still granting access, or RLS never got switched on.
--
-- This script drops EVERY policy on the table, then recreates only the two we
-- want. Safe to re-run.
-- ============================================================================

-- ─── 1. Show what's there now (check the output of this first) ──────────────
SELECT policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'community_flags';

-- ─── 2. Drop every existing policy, whatever it's called ────────────────────
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_flags'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.community_flags', pol.policyname);
  END LOOP;
END
$$;

-- ─── 3. Make sure RLS is actually on ────────────────────────────────────────
-- ENABLE alone can be bypassed by the table owner; FORCE closes that too.
ALTER TABLE public.community_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_flags FORCE ROW LEVEL SECURITY;

-- ─── 4. Recreate exactly the two policies we want ───────────────────────────
-- Signed-in users may submit a report, attributed to themselves.
CREATE POLICY "Users can submit own flags"
ON public.community_flags
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- Users may read back only their own submissions.
CREATE POLICY "Users can read own flags"
ON public.community_flags
FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- No UPDATE or DELETE policy: nobody can edit or remove reports through the
-- API. Moderate them in the dashboard instead.

-- ─── 5. Confirm the result ──────────────────────────────────────────────────
SELECT
  relrowsecurity  AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE oid = 'public.community_flags'::regclass;

SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'community_flags';

-- Expected: rls_enabled = true, rls_forced = true, and exactly two policies,
-- both scoped to the "authenticated" role.
-- ============================================================================
