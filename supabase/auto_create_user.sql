-- ============================================================================
-- AUTO-CREATE public.users row when a new auth user signs up.
-- This removes the need for the client-side INSERT entirely.
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Create a function that inserts into public.users on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as the DB owner, bypasses RLS
SET search_path = public  -- prevent search_path hijacking
AS $$
BEGIN
  INSERT INTO public.users (id, email, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    false
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Done! Now whenever a user signs up via Supabase Auth, a matching row
-- is automatically created in public.users with profile_completed = false.
-- The client code no longer needs to INSERT manually.
-- ============================================================================
