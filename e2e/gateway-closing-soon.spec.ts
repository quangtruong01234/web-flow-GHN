import { expect, type Page, test } from "@playwright/test";

// The closing-soon notice reads the browser clock, so each test freezes it at
// an instant written with an explicit offset — the host zone never matters.

/** Answer the local liveness probe and the session check; record GHN calls. */
async function setupGateway(page: Page, health: "online" | "offline"): Promise<string[]> {
  const ghnCalls: string[] = [];

  await page.route("**/gateway-health", async (route) => {
    await route.fulfill({
      json: { status: health, checkedAt: new Date().toISOString(), httpStatus: 200 },
    });
  });
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/ghn/")) ghnCalls.push(url);
    await route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
  });

  return ghnCalls;
}

test.describe("gateway closing-soon notice", () => {
  test("warns in the last minutes before 19:00 ICT", async ({ page }) => {
    const ghnCalls = await setupGateway(page, "online");
    await page.clock.setFixedTime(new Date("2026-10-06T18:52:00+07:00"));

    await page.goto("/login");

    await expect(page.getByRole("status").filter({ hasText: "scheduled to stop" })).toHaveText(
      /scheduled to stop at 19:00 ICT \(UTC\+7\), in about 8 min/,
    );
    expect(ghnCalls).toEqual([]);
  });

  test("stays quiet earlier in the window", async ({ page }) => {
    await setupGateway(page, "online");
    await page.clock.setFixedTime(new Date("2026-10-06T16:00:00+07:00"));

    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText(/scheduled to stop/)).toHaveCount(0);
  });

  test("gives way to the offline notice once the gateway stops answering", async ({
    page,
  }) => {
    await setupGateway(page, "offline");
    await page.clock.setFixedTime(new Date("2026-10-06T18:59:30+07:00"));

    await page.goto("/login");

    await expect(page.getByText(/scheduled to run 14:00–19:00 ICT/)).toBeVisible();
    await expect(page.getByText(/scheduled to stop/)).toHaveCount(0);
  });
});
