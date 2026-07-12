import { expect, type Page, test } from "@playwright/test";

import {
  backendCodUpdateResult,
  backendDetailResponse,
  backendHistoryRow,
  backendMeUser,
  backendPaginatedList,
  backendReceiverUpdateResult,
  backendSyncResult,
} from "../src/features/ghn-shipping/testing/fixtures";

const user = backendMeUser("shipping_manager");
const detail = backendDetailResponse();
const list = backendPaginatedList();
const history = [backendHistoryRow({ previousStatus: "shipped" })];

interface GatewayOptions {
  syncStatus?: number;
  syncMessage?: string;
  demoStatus?: number;
  demoMessage?: string;
}

async function setupGateway(page: Page, options: GatewayOptions = {}): Promise<void> {
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

    if (method === "GET" && path === "/api/order/admin/ghn/orders/101") {
      await route.fulfill({ json: { data: detail } });
      return;
    }

    if (method === "GET" && path === "/api/order/admin/ghn/orders/101/history") {
      await route.fulfill({ json: { data: history } });
      return;
    }

    if (method === "POST" && path === "/api/order/admin/ghn/orders/101/sync") {
      const status = options.syncStatus ?? 201;
      if (status >= 400) {
        await route.fulfill({
          status,
          json: { message: options.syncMessage ?? "Sync failed" },
        });
        return;
      }
      await route.fulfill({
        status: 201,
        json: { data: backendSyncResult() },
      });
      return;
    }

    if (method === "POST" && path === "/api/order/admin/ghn/orders/101/update-cod") {
      expect(request.postDataJSON()).toEqual({ codAmount: 0 });
      await route.fulfill({
        status: 201,
        json: { data: backendCodUpdateResult() },
      });
      return;
    }

    if (method === "POST" && path === "/api/order/admin/ghn/orders/101/update-receiver") {
      expect(request.postDataJSON()).toEqual({ toName: "Receiver Two" });
      await route.fulfill({
        status: 201,
        json: { data: backendReceiverUpdateResult() },
      });
      return;
    }

    if (method === "POST" && path === "/api/order/admin/ghn/orders/101/demo-status") {
      const status = options.demoStatus ?? 201;
      if (status >= 400) {
        await route.fulfill({
          status,
          json: { message: options.demoMessage ?? "Demo status failed" },
        });
        return;
      }
      await route.fulfill({
        status: 201,
        json: {
          data: backendSyncResult({
            newStatus: "completed",
            ghnStatus: "delivered",
            syncedAt: "2026-06-27T10:03:00.000Z",
          }),
        },
      });
      return;
    }

    await route.fulfill({
      status: 500,
      json: { message: `Unhandled mocked route: ${method} ${path}` },
    });
  });
}

test.describe("shipment action flows", () => {
  test("edits COD and receiver through gateway-backed mutations", async ({ page }) => {
    await setupGateway(page);
    await page.goto("/shipments/101");

    await page.getByRole("button", { name: "Update COD" }).click();
    await page.locator("#cod-amount").fill("0");
    await page.getByRole("button", { name: "Save COD" }).click();
    await expect(page.getByText("COD updated")).toBeVisible();

    await page.getByRole("button", { name: "Update receiver info" }).click();
    await page.locator("#receiver-name").fill("Receiver Two");
    await page.getByRole("button", { name: "Save receiver" }).click();
    await expect(page.getByText("Receiver updated")).toBeVisible();
  });

  test("shows non-retryable sync copy for an unresolvable GHN waybill", async ({
    page,
  }) => {
    await setupGateway(page, {
      syncStatus: 404,
      syncMessage: "GHN order GHN101 not found: OrderCode not found",
    });
    await page.goto("/shipments/101");

    await page.getByRole("button", { name: "Sync GHN status" }).click();

    await expect(page.getByText("GHN waybill not found")).toBeVisible();
    await expect(page.getByText(/not retryable/i)).toBeVisible();
  });

  test("shows retryable sync copy when GHN is temporarily unavailable", async ({
    page,
  }) => {
    await setupGateway(page, {
      syncStatus: 503,
      syncMessage: "GHN detail request failed: timeout",
    });
    await page.goto("/sync");

    await page.getByRole("button", { name: "Sync" }).click();

    await expect(page.getByText("GHN temporarily unavailable for #101")).toBeVisible();
    await expect(page.getByText(/Try syncing again/i)).toBeVisible();
  });

  test("surfaces disabled demo-status as environment feedback", async ({ page }) => {
    await setupGateway(page, {
      demoStatus: 403,
      demoMessage: "GHN demo status endpoint is disabled",
    });
    await page.goto("/shipments/101");

    await expect(page.getByText("Demo controls")).toBeVisible();
    await page.getByRole("button", { name: "Apply demo status" }).click();

    await expect(page.getByText("Demo mode not enabled")).toBeVisible();
  });
});
