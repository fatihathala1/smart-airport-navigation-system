const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 8;

export function checkLoginAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 0, resetAt: now + WINDOW_MS }); return true; }
  return current.count < MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  attempts.set(key, !current || current.resetAt <= now ? { count: 1, resetAt: now + WINDOW_MS } : { ...current, count: current.count + 1 });
}

export function clearLoginFailures(key: string) { attempts.delete(key); }
