import type { MiddlewareHandler } from "hono";
/**
 * Constant-time comparison of the provided API key against the expected one.
 *
 * Returns `false` (without calling timingSafeEqual) when either side is
 * missing or the lengths differ — timingSafeEqual throws on length mismatch.
 */
export declare function verifyApiKey(provided: string | undefined, expected: string): boolean;
/**
 * Hono middleware that rejects requests without a valid `X-API-Key` header
 * with `401` before any route handler (scrape/cache read) runs.
 */
export declare function apiKeyAuth(expected: string): MiddlewareHandler;
