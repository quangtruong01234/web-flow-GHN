import { expect, type Page, test } from "@playwright/test";

import {
  backendDetailResponse,
  backendHistoryRow,
  backendMeUser,
  ORDER_PUBLIC_ID,
  backendPaginatedList,
} from "../src/features/ghn-shipping/testing/fixtures";

// Role-matrix coverage for the read-only `logistics_operator`: list/detail
// stay readable while sync, carrier actions, waybill edits, and demo controls
// are disabled with the shipping-manager hint copy. Mirrors the mocked-gateway
// setup in shipment-actions.spec.ts, which covers `shipping_manager`.

const user = backendMeUser("logistics_operator");
const detail = backendDetailResponse();
const list = backendPaginatedList();
const history = [backendHistoryRow({ previousStatus: "shipped" })];

async function setupGateway(page: Page): Promise<void> {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (method === "GET" && path === "/api/user/me") {
      await route.fulfill({ json: { data: user } });
      return;
    }

    if (method === "GET" && path === "/api/order/admin/ghn/orders") {
      await route.fulfill({ json: { data: list } });
      return;
    }

    if (method === "GET" && path === `/api/order/admin/ghn/orders/${ORDER_PUBLIC_ID}`) {
      await route.fulfill({ json: { data: detail } });
      return;
    }

    if (method === "GET" && path === `/api/order/admin/ghn/orders/${ORDER_PUBLIC_ID}/history`) {
      await route.fulfill({ json: { data: history } });
      return;
    }

    // The read-only role must never reach a mutation route: the backend would
    // 403, but the UI is expected to disable the controls before that.
    if (method === "POST") {
      await route.fulfill({
        status: 403,
        json: { message: `Forbidden mutation from logistics_operator: ${path}` },
      });
      return;
    }

    await route.fulfill({
      status: 500,
      json: { message: `Unhandled mocked route: ${method} ${path}` },
    });
  });
}

test.describe("logistics_operator role matrix", () => {
  test("reads the shipment list and opens detail", async ({ page }) => {
    await setupGateway(page);
    await page.goto("/shipments");

    await page.getByRole("link", { name: `#${ORDER_PUBLIC_ID}` }).click();

    await expect(
      page.getByRole("heading", { name: `#${ORDER_PUBLIC_ID}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Shipping timeline")).toBeVisible();
    await expect(page.getByText("Synced from GHN")).toBeVisible();
  });

  test("sync, carrier actions, and waybill edits are disabled on detail", async ({
    page,
  }) => {
    await setupGateway(page);
    await page.goto(`/shipments/${ORDER_PUBLIC_ID}`);

    await expect(
      page.getByRole("button", { name: "Sync GHN status" }),
    ).toBeDisabled();
    await expect(
      page.getByText("Syncing requires the shipping manager role."),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Cancel shipment" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Return to seller" }),
    ).toBeDisabled();
    await expect(
      page.getByText("Carrier actions require the shipping manager role."),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Update COD" })).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Update receiver info" }),
    ).toBeDisabled();
    await expect(
      page.getByText("Waybill edits require the shipping manager role."),
    ).toBeVisible();
  });

  test("demo controls render read-only", async ({ page }) => {
    await setupGateway(page);
    await page.goto(`/shipments/${ORDER_PUBLIC_ID}`);

    await expect(page.getByText("Demo controls")).toBeVisible();
    await expect(page.locator("#demo-ghn-status")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Apply demo status" }),
    ).toBeDisabled();
    await expect(
      page.getByText("Demo status requires the shipping manager role."),
    ).toBeVisible();
  });

  test("sync page is read-only", async ({ page }) => {
    await setupGateway(page);
    await page.goto("/sync");

    await expect(
      page.getByText("Read-only — syncing requires the shipping manager role."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sync", exact: true }),
    ).toBeDisabled();
  });
});
