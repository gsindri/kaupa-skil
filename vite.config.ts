import dotenv from "dotenv"

// Prefer .env.test when running Vitest; otherwise load .env
if (process.env.VITEST) {
  dotenv.config({ path: ".env.test" })
} else {
  dotenv.config()
}

import { defineConfig } from "vite"
import { configDefaults } from "vitest/config"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    exclude: [...configDefaults.exclude, "e2e/**"],
    // Forward env vars into Vitest runtime (important for CI)
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    },
  },
}))
