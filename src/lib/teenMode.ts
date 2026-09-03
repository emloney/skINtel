const KEY = 'skintel-teen-mode';

/**
 * Teen mode is derived from the profile's age range, but the splash screen
 * renders before the session (let alone the profile) has loaded. Remembering
 * the last known value locally lets the splash theme itself immediately on
 * return visits; the profile remains the source of truth and refreshes it.
 *
 * A first-ever visit simply shows the default theme.
 */
export function getStoredTeenMode(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false; // private mode / storage disabled
  }
}

export function setStoredTeenMode(isTeen: boolean): void {
  try {
    if (isTeen) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
