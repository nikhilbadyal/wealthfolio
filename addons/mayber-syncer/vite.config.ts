import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import externalGlobals from "rollup-plugin-external-globals";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Force production React branches because addons are built as deployable bundles.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/addon.tsx",
      fileName: () => "addon.js",
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize React and ReactDOM so the addon uses the host's version
      external: ["react", "react-dom"],
      plugins: [
        externalGlobals({
          // Bind React imports to Wealthfolio's host-provided global to avoid bundling a second React copy.
          react: "React",
          // Bind ReactDOM imports to the host copy for the same single-React-runtime reason.
          "react-dom": "ReactDOM",
        }),
      ],
      output: {
        globals: {
          // Keep Rollup's global mapping aligned with the external-globals plugin.
          react: "React",
          // Keep Rollup's global mapping aligned with the external-globals plugin.
          "react-dom": "ReactDOM",
        },
      },
    },
    outDir: "dist",
    // Keep the bundle readable because this importer is still easier to diagnose from user logs.
    minify: false,
    sourcemap: true,
  },
});
