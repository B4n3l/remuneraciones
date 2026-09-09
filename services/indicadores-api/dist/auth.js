import { timingSafeEqual } from "node:crypto";
/**
 * Constant-time comparison of the provided API key against the expected one.
 *
 * Returns `false` (without calling timingSafeEqual) when either side is
 * missing or the lengths differ — timingSafeEqual throws on length mismatch.
 */
export function verifyApiKey(provided, expected) {
    if (!provided || !expected) {
        return false;
    }
    const providedBuf = Buffer.from(provided, "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    if (providedBuf.length !== expectedBuf.length) {
        return false;
    }
    return timingSafeEqual(providedBuf, expectedBuf);
}
/**
 * Hono middleware that rejects requests without a valid `X-API-Key` header
 * with `401` before any route handler (scrape/cache read) runs.
 */
export function apiKeyAuth(expected) {
    return async (c, next) => {
        const provided = c.req.header("X-API-Key");
        if (!verifyApiKey(provided, expected)) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        await next();
    };
}
//# sourceMappingURL=auth.js.map