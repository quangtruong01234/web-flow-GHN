import { defineConfig, devices } from "@playwright/test";

// E2E specs live in ./e2e and run against the dev server on port 3013.
// Playwright starts the dev server automatically (reusing one if already up).
// Set E2E_BASE_URL to target a server on another port (e.g. when 3013 is taken).
process.env.NEXT_PUBLIC_GHN_DEMO_MODE ??= "true";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3013";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
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
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
