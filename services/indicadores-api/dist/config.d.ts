/**
 * Environment configuration for the microservice.
 *
 * `INDICADORES_SERVICE_API_KEY` is required — the service refuses to boot
 * without it. Source URLs are configurable for format-drift recovery; they
 * support `{year}` and `{month}` placeholders (e.g. `.../impuesto_{year}.htm`).
 */
export interface Config {
    apiKey: string;
    previredUrl: string;
    siiUrl: string;
    mindicadorUrl: string;
    alertTarget: string;
    port: number;
}
export declare function loadConfig(env?: NodeJS.ProcessEnv): Config;
