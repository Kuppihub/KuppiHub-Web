/**
 * Utility for handling application-wide sessionStorage caching with a single unified 3-minute timer.
 */

const SESSION_TIMER_KEY = 'kuppihub_session_timer';
const CACHE_EXPIRATION_MS = 3 * 60 * 1000; // 3 minutes
const DASHBOARD_MODULES_KEY = 'dashboardModules';

function clearPrefixedSessionKeys(prefixes: string[]) {
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
}

/**
 * Clears guest/user client caches that must not leak across auth identity changes.
 * Call on login and logout so "already added" / dashboard state always match the current user.
 */
export function clearClientCaches(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(DASHBOARD_MODULES_KEY);
  clearPrefixedSessionKeys(['dashboard-cache:', 'module-kuppi-cache:']);
  window.sessionStorage.removeItem(SESSION_TIMER_KEY);
  window.dispatchEvent(new CustomEvent('authCachesCleared'));
}

/**
 * Checks if the global cache expiration timer in sessionStorage has expired.
 * If expired, it resets the timer and clears all cached items starting with
 * 'dashboard-cache:' and 'module-kuppi-cache:' from sessionStorage.
 * 
 * @returns {boolean} True if the cache was expired and has been cleared, false otherwise.
 */
export function checkAndManageCacheExpiration(): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const timerRaw = window.sessionStorage.getItem(SESSION_TIMER_KEY);

  if (timerRaw) {
    const timerVal = parseInt(timerRaw, 10);
    if (!isNaN(timerVal) && now - timerVal > CACHE_EXPIRATION_MS) {
      // Cache has expired! Update the session timer to now.
      window.sessionStorage.setItem(SESSION_TIMER_KEY, now.toString());
      clearPrefixedSessionKeys(['dashboard-cache:', 'module-kuppi-cache:']);
      return true; // Cache was expired and cleared
    }
  } else {
    // Initialize the session timer
    window.sessionStorage.setItem(SESSION_TIMER_KEY, now.toString());
  }

  return false;
}

/**
 * Helper to force-expire the cache globally (e.g. after adding/mutating content).
 */
export function forceExpireCache(): void {
  if (typeof window === 'undefined') return;
  // Set the timer to 0 so the next check will automatically treat it as expired.
  window.sessionStorage.setItem(SESSION_TIMER_KEY, '0');
}
