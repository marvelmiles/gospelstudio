import { defineConfig } from "vitest/config";

export default defineConfig({
  json: {
    stringify: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
