import type { Indicadores } from "./contract.js";

export interface CacheEntry {
  data: Indicadores;
  fetchedAt: Date;
}

export interface IndicadoresCache {
  get(key: string): CacheEntry | undefined;
  set(key: string, entry: CacheEntry): void;
}

/**
 * In-memory cache keyed by `"YYYY-MM"`. Single-instance service: the repo DB
 * remains the durable store; Redis only if multi-instance is needed later.
 */
export function createCache(): IndicadoresCache {
  const store = new Map<string, CacheEntry>();
  return {
    get(key) {
      return store.get(key);
    },
    set(key, entry) {
      store.set(key, entry);
    },
  };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
