import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { resolve } from "node:path";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { modulesPlugin } from "./build/modules-vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const roots = env.STARTERKIT_MODULE_PATHS
    ? env.STARTERKIT_MODULE_PATHS.split(",").map((path) => path.trim())
    : undefined;

  return {
    plugins: [
      modulesPlugin({
        roots,
        statePath: env.STARTERKIT_MODULE_STATE,
      }),
      laravel({ input: "resources/spa/main.tsx", refresh: true }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@starterkit/module-kit": resolve(
          process.cwd(),
          "resources/spa/module-kit/index.ts",
        ),
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_PORT || 5173),
      strictPort: true,
      watch: { usePolling: true, interval: 500 },
      hmr: {
        host: env.VITE_HMR_HOST || "localhost",
        clientPort: Number(env.VITE_PORT || 5173),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["resources/spa/test/setup.ts"],
      include: [
        "resources/spa/**/*.test.{ts,tsx}",
        "modules/acme/inventory/resources/spa/**/*.test.{ts,tsx}",
      ],
      restoreMocks: true,
    },
  };
});
