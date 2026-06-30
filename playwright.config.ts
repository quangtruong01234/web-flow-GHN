import { defineConfig, devices } from "@playwright/test";

// E2E specs live in ./e2e and run against the dev server on port 3013.
// Playwright starts the dev server automatically (reusing one if already up).
process.env.NEXT_PUBLIC_GHN_DEMO_MODE ??= "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3013",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: "npm.cmd run dev",
        url: "http://localhost:3013",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
