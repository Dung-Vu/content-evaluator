export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  check(ip: string): RateLimitResult;
}

class MemoryRateLimiter implements RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;
  private lastCleanup: number = Date.now();
  private cleanupIntervalMs: number = 5 * 60 * 1000;

  constructor(limit: number = 20, windowSeconds: number = 60) {
    this.limit = limit;
    this.windowMs = windowSeconds * 1000;
  }

  check(ip: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup();
    }

    let ipRequests = this.requests.get(ip) || [];
    ipRequests = ipRequests.filter((timestamp) => timestamp > windowStart);

    if (ipRequests.length >= this.limit) {
      const oldestRequest = ipRequests[0];
      const timeRemainingMs = oldestRequest + this.windowMs - now;
      const retryAfterSeconds = Math.ceil(timeRemainingMs / 1000);

      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    ipRequests.push(now);
    this.requests.set(ip, ipRequests);

    return { allowed: true };
  }

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

  clear() {
    this.requests.clear();
    this.lastCleanup = Date.now();
  }

  getActiveIpCount(): number {
    return this.requests.size;
  }
}

export const memoryRateLimiter = new MemoryRateLimiter(
  process.env.RATE_LIMIT_PER_MINUTE
    ? parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10)
    : 20,
  60,
);
