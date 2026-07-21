/**
 * Extract a human-readable message from an unknown thrown value.
 * Supabase (postgrest-js) errors are often plain objects with a `message`
 * property rather than Error instances, so `instanceof Error` alone drops them.
 */
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
