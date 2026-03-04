export async function register(): Promise<void> {
  // Only run in the Node.js runtime — the Edge Runtime cannot use the OTel
  // Node SDK because it depends on async_hooks, perf_hooks, net, etc.
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // Dynamic imports keep OTel SDK out of the Edge Runtime bundle entirely.
  // Static imports at the top level would cause the bundler to include
  // Node-only modules in the edge worker, triggering resolution failures.
  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { Resource } = await import("@opentelemetry/resources");
  const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
    "@opentelemetry/semantic-conventions"
  );
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-http"
  );
  const { OTLPMetricExporter } = await import(
    "@opentelemetry/exporter-metrics-otlp-http"
  );
  const { OTLPLogExporter } = await import(
    "@opentelemetry/exporter-logs-otlp-http"
  );
  const { PeriodicExportingMetricReader } = await import(
    "@opentelemetry/sdk-metrics"
  );
  const { BatchLogRecordProcessor } = await import("@opentelemetry/sdk-logs");
  const { getNodeAutoInstrumentations } = await import(
    "@opentelemetry/auto-instrumentations-node"
  );

  const otlpEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

  const resource = Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "amazone-web",
      [ATTR_SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION ?? "0.1.0",
      "deployment.environment.name": process.env.NODE_ENV ?? "development",
    }),
  );

  const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${otlpEndpoint}/v1/metrics`,
  });

  const logExporter = new OTLPLogExporter({
    url: `${otlpEndpoint}/v1/logs`,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 30_000,
    }),
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable noisy instrumentations irrelevant to an e-commerce app
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
        // HTTP instrumentation captures all incoming Next.js requests
        "@opentelemetry/instrumentation-http": { enabled: true },
        // Undici instruments Node's native fetch() used in server components
        "@opentelemetry/instrumentation-undici": { enabled: true },
      }),
    ],
  });

  sdk.start();

  // Flush pending telemetry before the process exits (Docker stop, k8s SIGTERM)
  process.on("SIGTERM", () => {
    sdk.shutdown().catch((err: unknown) => {
      console.error("[OTel] SDK shutdown failed:", err);
    });
  });
}
