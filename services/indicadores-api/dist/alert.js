export function createAlertSink(config) {
    const target = config.alertTarget;
    return {
        async emit(payload) {
            const monthLabel = String(payload.month).padStart(2, "0");
            console.error(`[alert] ${payload.year}-${monthLabel} ${payload.source}: ${payload.error}`);
            if (!target)
                return;
            try {
                await fetch(target, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            catch (err) {
                console.error(`[alert] failed to deliver alert to ${target}:`, err);
            }
        },
    };
}
//# sourceMappingURL=alert.js.map