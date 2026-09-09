/**
 * Environment configuration for the microservice.
 *
 * `INDICADORES_SERVICE_API_KEY` is required — the service refuses to boot
 * without it. Source URLs and the alert target are configurable for
 * format-drift recovery; they default to empty strings until PR1b wires the
 * real scrapers.
 */
export interface Config {
  apiKey: string;
  previredUrl: string;
  siiUrl: string;
  mindicadorUrl: string;
  alertTarget: string;
  port: number;
}

const DEFAULT_PORT = 3000;

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): Config {
  const apiKey = env.INDICADORES_SERVICE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "INDICADORES_SERVICE_API_KEY is required (set it in the environment or .env)",
    );
  }

  return {
    apiKey,
    previredUrl: env.PREVIRED_URL ?? "",
    siiUrl: env.SII_CIRCULAR_URL ?? "",
    mindicadorUrl: env.MINDICADOR_URL ?? "",
    alertTarget: env.ALERT_TARGET ?? "",
    port: env.PORT ? Number(env.PORT) : DEFAULT_PORT,
  };
}
