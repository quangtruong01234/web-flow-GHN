import { expect, test } from "@playwright/test";

// Smoke coverage that runs without a live backend: the login screen renders and
// its client-side validation fires. (Flows requiring a real session/gateway are
// out of scope for this smoke test.)
test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/user/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthenticated" }),
      });
    });
  });

  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "TryBuy Shipping Admin" }),
    ).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows a validation error when submitting empty credentials", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("Enter both your username and password to continue."),
    ).toBeVisible();
  });
});
