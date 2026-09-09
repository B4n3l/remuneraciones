/**
 * In-memory cache keyed by `"YYYY-MM"`. Single-instance service: the repo DB
 * remains the durable store; Redis only if multi-instance is needed later.
 */
export function createCache() {
    const store = new Map();
    return {
        get(key) {
            return store.get(key);
        },
        set(key, entry) {
            store.set(key, entry);
        },
    };
}
export function monthKey(year, month) {
    return `${year}-${String(month).padStart(2, "0")}`;
}
//# sourceMappingURL=cache.js.map