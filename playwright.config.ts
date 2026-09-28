import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const storageState = "tests/e2e/.auth/admin.json";

const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
  : {};

const browserUse = {
  ...devices["Desktop Chrome"],
  launchOptions,
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: browserUse },
    {
      name: "public",
      testMatch: /.*\.anon\.spec\.ts/,
      use: browserUse,
    },
    {
      name: "authenticated",
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...browserUse, storageState },
    },
  ],
});
