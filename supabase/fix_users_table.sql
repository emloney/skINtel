-- ============================================================================
-- FIX: Add missing `email` column + set up RLS policies for public.users
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ─── 1. Add the missing `email` column ──────────────────────────────────────
-- The app stores email on sign-up but the column was never created.
-- `IF NOT EXISTS` keeps this safe to re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND column_name  = 'email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email text;
  END IF;
END
$$;

-- ─── 2. Enable RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ─── 3. Drop existing policies (safe to re-run) ────────────────────────────
DROP POLICY IF EXISTS "Users can read own row"   ON public.users;
DROP POLICY IF EXISTS "Users can insert own row"  ON public.users;
DROP POLICY IF EXISTS "Users can update own row"  ON public.users;

-- ─── 4. SELECT — user can read their own profile ───────────────────────────
CREATE POLICY "Users can read own row"
ON public.users
FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- ─── 5. INSERT — user can create their own profile row on sign-up ──────────
CREATE POLICY "Users can insert own row"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = id );

-- ─── 6. UPDATE — user can update their own profile (onboarding + edits) ────
CREATE POLICY "Users can update own row"
ON public.users
FOR UPDATE
TO authenticated
USING      ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- ============================================================================
-- Done! The app can now:
--   • INSERT a row on sign-up   (id, email, profile_completed)
--   • UPDATE the row on onboard (name, age_range, skin_type, etc.)
--   • SELECT to check profile_completed
-- All scoped to the logged-in user only.
-- ============================================================================
