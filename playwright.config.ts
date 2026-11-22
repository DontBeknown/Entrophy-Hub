import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3211" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3211",
    url: "http://127.0.0.1:3211",
    timeout: 120_000,
    env: { NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3211", CRON_SECRET: "entropy-hub-local-e2e-only" },
  },
});
