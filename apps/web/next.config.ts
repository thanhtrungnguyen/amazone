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
  output: "standalone",
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
