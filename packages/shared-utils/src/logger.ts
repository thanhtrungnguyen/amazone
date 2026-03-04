import pino from "pino";
import { trace, context } from "@opentelemetry/api";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Pino logger with automatic OpenTelemetry trace context injection.
 *
 * Every log entry includes `traceId` and `spanId` from the active OTel span.
 * Grafana Loki uses these fields to create clickable links to Tempo traces,
 * giving you log↔trace correlation out of the box.
 *
 * When no OTel SDK is registered (tests, Edge Runtime), the mixin returns
 * empty strings — no crash, just missing trace fields.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  mixin() {
    const activeSpan = trace.getSpan(context.active());
    if (!activeSpan) {
      return {};
    }
    const spanContext = activeSpan.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  },
});

/** Create a child logger scoped to a specific domain */
export function createLogger(domain: string): pino.Logger {
  return logger.child({ domain });
}
