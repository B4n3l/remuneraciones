import { Hono } from "hono";
/** Unauthenticated liveness/readiness probe. */
export function healthRoutes() {
    const routes = new Hono();
    routes.get("/", (c) => c.json({ status: "ok" }, 200));
    return routes;
}
//# sourceMappingURL=health.js.map