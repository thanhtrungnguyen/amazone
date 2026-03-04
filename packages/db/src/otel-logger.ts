import { trace, SpanStatusCode, type Tracer } from "@opentelemetry/api";
import type { Logger } from "drizzle-orm";

/**
 * Drizzle ORM logger that creates OpenTelemetry spans for each SQL query.
 *
 * Uses only `@opentelemetry/api` (not the SDK) — when no SDK is registered
 * (e.g., Edge Runtime or test environments), all operations are no-ops.
 *
 * Note: Drizzle's Logger.logQuery() fires *before* the async query executes,
 * so span duration reflects logger invocation, not DB round-trip time.
 * When Drizzle's middleware API (`db.use()`) stabilizes, this can be
 * restructured to wrap actual query execution for accurate timing.
 */
export class DrizzleOtelLogger implements Logger {
  private readonly tracer: Tracer;

  constructor() {
    this.tracer = trace.getTracer("@amazone/db", "0.0.1");
  }

  logQuery(query: string, params: unknown[]): void {
    const operation =
      query.trimStart().split(/\s+/)[0]?.toUpperCase() ?? "QUERY";

    this.tracer.startActiveSpan(
      `db.${operation.toLowerCase()}`,
      {
        attributes: {
          "db.system": "postgresql",
          "db.operation": operation,
          "db.statement": query,
          ...(process.env.OTEL_LOG_LEVEL === "debug" && {
            "db.parameters": JSON.stringify(params),
          }),
        },
      },
      (span) => {
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      },
    );
  }
}
