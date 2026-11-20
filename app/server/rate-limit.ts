export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  private recent(key: string, now: number): number[] {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (list.length) this.hits.set(key, list);
    else this.hits.delete(key);
    return list;
  }

  limited(key: string, now = Date.now()): boolean {
    return this.recent(key, now).length >= this.max;
  }

  hit(key: string, now = Date.now()) {
    this.hits.set(key, [...this.recent(key, now), now]);
  }
}
