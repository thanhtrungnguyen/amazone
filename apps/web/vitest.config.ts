import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@amazone/shared-utils": path.resolve(
        __dirname,
        "../../packages/shared-utils/src/index.ts"
      ),
      "@amazone/products": path.resolve(
        __dirname,
        "../../packages/products/src/index.ts"
      ),
      "@amazone/cart": path.resolve(
        __dirname,
        "../../packages/cart/src/index.ts"
      ),
    },
  },
});
