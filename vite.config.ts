import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), checker({ typescript: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "window",
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8",
    },
    setupFiles: ["./src/test/setup.ts"],
  },
});
