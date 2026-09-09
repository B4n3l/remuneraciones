import type { Config } from "./config.js";
export interface AlertPayload {
    year: number;
    month: number;
    source: string;
    error: string;
}
/**
 * Alert sink for scrape/parse failures. Emits a structured log line and, when
 * `ALERT_TARGET` is configured, POSTs the payload as JSON to that webhook.
 * Empty target → log only (alerts disabled).
 */
export interface AlertSink {
    emit(payload: AlertPayload): Promise<void>;
}
export declare function createAlertSink(config: Config): AlertSink;
