// vite.config.ts
import { defineConfig } from "vite"
import { configDefaults } from "vitest/config"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"
import svgr from "vite-plugin-svgr"

export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
plugins: [
    react(), 
    svgr({
      svgrOptions: {
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                  cleanupIds: false,
                  removeUselessStrokeAndFill: false,
                  // Crucial: don't remove style elements for animations
                  removeStyleElement: false,
                },
              },
            },
          ],
        },
      },
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    exclude: [...configDefaults.exclude, "e2e/**"],
    env: {
      // forward CI secrets to Vitest (ignored in dev builds)
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    },
  },
}))
