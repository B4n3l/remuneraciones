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

export function createAlertSink(config: Config): AlertSink {
  const target = config.alertTarget;
  return {
    async emit(payload: AlertPayload): Promise<void> {
      const monthLabel = String(payload.month).padStart(2, "0");
      console.error(
        `[alert] ${payload.year}-${monthLabel} ${payload.source}: ${payload.error}`,
      );
      if (!target) return;

      try {
        await fetch(target, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error(
          `[alert] failed to deliver alert to ${target}:`,
          err,
        );
      }
    },
  };
}
