export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  check(ip: string): Promise<RateLimitResult>;
}

class MemoryRateLimiter implements RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;
  private lastCleanup: number = Date.now();
  private cleanupIntervalMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(limit: number = 20, windowSeconds: number = 60) {
    this.limit = limit;
    this.windowMs = windowSeconds * 1000;
  }

  async check(ip: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Periodically run global cleanup
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup();
    }

    // Get current requests for this IP
    let ipRequests = this.requests.get(ip) || [];

    // Filter out requests older than the sliding window
    ipRequests = ipRequests.filter((timestamp) => timestamp > windowStart);

    if (ipRequests.length >= this.limit) {
      // Find when the earliest request will expire to calculate retryAfterSeconds
      const oldestRequest = ipRequests[0];
      const timeRemainingMs = oldestRequest + this.windowMs - now;
      const retryAfterSeconds = Math.ceil(timeRemainingMs / 1000);

      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    // Record this request
    ipRequests.push(now);
    this.requests.set(ip, ipRequests);

    return {
      allowed: true,
    };
  }

  // Force a cleanup sweep of all stale/inactive IPs
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests.entries()) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
    this.lastCleanup = now;
  }

  // Helper to clear memory for testing
  clear() {
    this.requests.clear();
    this.lastCleanup = Date.now();
  }

  // Helper to inspect current active IP count (for testing)
  getActiveIpCount(): number {
    return this.requests.size;
  }
}

// Global singleton instance (lazy-initialized)
let _instance: MemoryRateLimiter | null = null;

export function getRateLimiter(): MemoryRateLimiter {
  if (!_instance) {
    const limit = process.env.RATE_LIMIT_PER_MINUTE
      ? parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10)
      : 20;
    _instance = new MemoryRateLimiter(limit, 60);
  }
  return _instance;
}

export const memoryRateLimiter = new Proxy({} as MemoryRateLimiter, {
  get(_, prop: keyof MemoryRateLimiter) {
    return getRateLimiter()[prop];
  },
});
