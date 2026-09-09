import { Hono } from "hono";

/** Unauthenticated liveness/readiness probe. */
export function healthRoutes(): Hono {
  const routes = new Hono();
  routes.get("/", (c) => c.json({ status: "ok" }, 200));
  return routes;
}
