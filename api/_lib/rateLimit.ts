/**
 * Simple in-memory rate limiter for API abuse protection
 * 
 * LIMITATIONS: This uses in-memory storage which is not shared across
 * Vercel serverless instances. Each instance maintains its own counter.
 * For production with multiple instances, consider using Redis or similar.
 * 
 * This provides basic protection against trivial abuse but is not
 * a distributed rate-limiting solution.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_REQUESTS_PER_HOUR = 60;

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - IP address or other identifier
 * @returns Object with allowed status and retry-after seconds if not allowed
 */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  cleanup();
  
  const now = Date.now();
  const minuteKey = `${identifier}:minute`;
  const hourKey = `${identifier}:hour`;
  
  const minuteEntry = store.get(minuteKey);
  const hourEntry = store.get(hourKey);
  
  // Check minute limit
  if (minuteEntry && minuteEntry.count >= MAX_REQUESTS_PER_MINUTE && minuteEntry.resetTime > now) {
    return { allowed: false, retryAfter: Math.ceil((minuteEntry.resetTime - now) / 1000) };
  }
  
  // Check hour limit
  if (hourEntry && hourEntry.count >= MAX_REQUESTS_PER_HOUR && hourEntry.resetTime > now) {
    return { allowed: false, retryAfter: Math.ceil((hourEntry.resetTime - now) / 1000) };
  }
  
  // Update counters
  const minuteReset = now + 60_000;
  const hourReset = now + 3_600_000;
  
  if (minuteEntry && minuteEntry.resetTime > now) {
    minuteEntry.count++;
  } else {
    store.set(minuteKey, { count: 1, resetTime: minuteReset });
  }
  
  if (hourEntry && hourEntry.resetTime > now) {
    hourEntry.count++;
  } else {
    store.set(hourKey, { count: 1, resetTime: hourReset });
  }
  
  return { allowed: true };
}

/**
 * Get client IP from request headers
 * Falls back to a default if headers are not available
 */
export function getClientIp(req: { headers?: Record<string, string | undefined> }): string {
  const headers = req.headers || {};
  
  // Check common proxy headers
  const forwardedFor = headers['x-forwarded-for'];
  const realIp = headers['x-real-ip'];
  const cfConnectingIp = headers['cf-connecting-ip'];
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}
