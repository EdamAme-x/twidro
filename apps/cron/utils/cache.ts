export class Cache<T> {
  private cacheKey: string | null = null;

  constructor(private cacheValue: T) {}

  public checkUpdated(cacheKey: string): boolean {
    return this.cacheKey !== cacheKey;
  }

  public update(cacheKey: string, cacheValue: T): void {
    this.cacheKey = cacheKey;
    this.cacheValue = cacheValue;
  }

  public get(): T {
    return this.cacheValue;
  }
}
