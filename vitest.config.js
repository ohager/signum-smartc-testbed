// vitest.config.ts
import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [...coverageConfigDefaults.exclude, "docs/**"],
    },
  },
});
