const DEFAULT_PORT = 3000;
/** mindicador.cl is a stable public API and the documented UF/UTM/UTA fallback. */
const DEFAULT_MINDICADOR_URL = "https://mindicador.cl/api";
export function loadConfig(env = process.env) {
    const apiKey = env.INDICADORES_SERVICE_API_KEY;
    if (!apiKey) {
        throw new Error("INDICADORES_SERVICE_API_KEY is required (set it in the environment or .env)");
    }
    return {
        apiKey,
        previredUrl: env.PREVIRED_URL ?? "",
        siiUrl: env.SII_CIRCULAR_URL ?? "",
        mindicadorUrl: env.MINDICADOR_URL ?? DEFAULT_MINDICADOR_URL,
        alertTarget: env.ALERT_TARGET ?? "",
        port: env.PORT ? Number(env.PORT) : DEFAULT_PORT,
    };
}
//# sourceMappingURL=config.js.map