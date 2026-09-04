/**
 * Extract a human-readable message from an unknown thrown value.
 * Supabase (postgrest-js) errors are often plain objects with a `message`
 * property rather than Error instances, so `instanceof Error` alone drops them.
 */
/**
 * Supabase's auth messages are written for developers ("Invalid login
 * credentials", "Unable to validate email address: invalid format"). Map the
 * ones users actually hit onto something that says what to do next.
 */
export function friendlyAuthError(err: unknown): string {
  const raw = errorMessage(err, '').toLowerCase();
  const code = (err as { code?: string })?.code ?? '';

  if (code === 'invalid_credentials' || raw.includes('invalid login credentials')) {
    return "That email and password don't match an account. Check them and try again.";
  }
  if (code === 'weak_password' || raw.includes('password should be at least')) {
    return 'Your password needs to be at least 6 characters.';
  }
  if (code === 'validation_failed' || raw.includes('unable to validate email')) {
    return "That doesn't look like a valid email address.";
  }
  if (code === 'user_already_exists' || raw.includes('already registered')) {
    return 'An account with this email already exists — try signing in instead.';
  }
  if (code === 'email_not_confirmed' || raw.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the link.';
  }
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (raw.includes('fetch') || raw.includes('network')) {
    return "Couldn't reach the server. Check your internet connection and try again.";
  }
  return errorMessage(err, 'Something went wrong. Please try again.');
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}
