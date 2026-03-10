import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@amazone/db",
    "@amazone/products",
    "@amazone/cart",
    "@amazone/checkout",
    "@amazone/orders",
    "@amazone/users",
    "@amazone/reviews",
    "@amazone/shared-ui",
    "@amazone/shared-utils",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  output: "standalone",
  serverExternalPackages: [
    "postgres",
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/exporter-metrics-otlp-http",
    "@opentelemetry/exporter-logs-otlp-http",
    "@opentelemetry/sdk-logs",
    "@opentelemetry/resources",
    "ioredis",
  ],
};

export default nextConfig;
