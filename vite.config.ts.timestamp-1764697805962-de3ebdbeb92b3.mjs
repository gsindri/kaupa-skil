// vite.config.ts
import { defineConfig } from "file:///C:/Users/gshsk/code/kaupa-skil/node_modules/.pnpm/vite@5.4.20_@types+node@22.17.2/node_modules/vite/dist/node/index.js";
import { configDefaults } from "file:///C:/Users/gshsk/code/kaupa-skil/node_modules/.pnpm/vitest@3.2.4_@types+node@22.17.2_jsdom@26.1.0/node_modules/vitest/dist/config.js";
import react from "file:///C:/Users/gshsk/code/kaupa-skil/node_modules/.pnpm/@vitejs+plugin-react-swc@3._b929e7df0e8701951725f7b82015a8c8/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/gshsk/code/kaupa-skil/node_modules/.pnpm/lovable-tagger@1.1.10_vite@5.4.20_@types+node@22.17.2_/node_modules/lovable-tagger/dist/index.js";
import svgr from "file:///C:/Users/gshsk/code/kaupa-skil/node_modules/.pnpm/vite-plugin-svgr@4.5.0_roll_b96aae3f683913f4eb8a24c4861af614/node_modules/vite-plugin-svgr/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\gshsk\\code\\kaupa-skil";
var vite_config_default = defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        svgo: false
        // Disable SVGO completely to preserve style blocks and animations
      }
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__vite_injected_original_dirname, "./src") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    exclude: [...configDefaults.exclude, "e2e/**"],
    env: {
      // forward CI secrets to Vitest (ignored in dev builds)
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxnc2hza1xcXFxjb2RlXFxcXGthdXBhLXNraWxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGdzaHNrXFxcXGNvZGVcXFxca2F1cGEtc2tpbFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZ3Noc2svY29kZS9rYXVwYS1za2lsL3ZpdGUuY29uZmlnLnRzXCI7Ly8gdml0ZS5jb25maWcudHNcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIlxyXG5pbXBvcnQgeyBjb25maWdEZWZhdWx0cyB9IGZyb20gXCJ2aXRlc3QvY29uZmlnXCJcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIlxyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiXHJcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiXHJcbmltcG9ydCBzdmdyIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCJcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7IGhvc3Q6IFwiOjpcIiwgcG9ydDogODA4MCB9LFxyXG5wbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLCBcclxuICAgIHN2Z3Ioe1xyXG4gICAgICBzdmdyT3B0aW9uczoge1xyXG4gICAgICAgIHN2Z286IGZhbHNlLCAvLyBEaXNhYmxlIFNWR08gY29tcGxldGVseSB0byBwcmVzZXJ2ZSBzdHlsZSBibG9ja3MgYW5kIGFuaW1hdGlvbnNcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZTogeyBhbGlhczogeyBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSB9IH0sXHJcbiAgdGVzdDoge1xyXG4gICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXHJcbiAgICBzZXR1cEZpbGVzOiBcIi4vc3JjL3NldHVwVGVzdHMudHNcIixcclxuICAgIGV4Y2x1ZGU6IFsuLi5jb25maWdEZWZhdWx0cy5leGNsdWRlLCBcImUyZS8qKlwiXSxcclxuICAgIGVudjoge1xyXG4gICAgICAvLyBmb3J3YXJkIENJIHNlY3JldHMgdG8gVml0ZXN0IChpZ25vcmVkIGluIGRldiBidWlsZHMpXHJcbiAgICAgIFZJVEVfU1VQQUJBU0VfVVJMOiBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCxcclxuICAgICAgVklURV9TVVBBQkFTRV9BTk9OX0tFWTogcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkpXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHNCQUFzQjtBQUMvQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8sVUFBVTtBQU5qQixJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVEsRUFBRSxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQUEsRUFDbkMsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsYUFBYTtBQUFBLFFBQ1gsTUFBTTtBQUFBO0FBQUEsTUFDUjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsRUFDNUMsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU8sRUFBRSxFQUFFO0FBQUEsRUFDNUQsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLElBQ1osU0FBUyxDQUFDLEdBQUcsZUFBZSxTQUFTLFFBQVE7QUFBQSxJQUM3QyxLQUFLO0FBQUE7QUFBQSxNQUVILG1CQUFtQixRQUFRLElBQUk7QUFBQSxNQUMvQix3QkFBd0IsUUFBUSxJQUFJO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
