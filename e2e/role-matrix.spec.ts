import { expect, type Page, test } from "@playwright/test";

import {
  backendDetailResponse,
  backendHistoryRow,
  backendListItem,
  backendMeUser,
  ORDER_PUBLIC_ID,
  backendPaginatedList,
} from "../src/features/ghn-shipping/testing/fixtures";

// Role-matrix coverage for the read-only `logistics_operator`: list/detail stay
// readable while no carrier action is offered. Mirrors the mocked-gateway setup
// in shipment-actions.spec.ts, which covers `shipping_manager`.
//
// GHN-ACT-01: the gateway trims `availableActions` by permission AND by order
// state, so the read-only role is expressed by the array the mock returns —
// `["read", "history"]`, exactly what the live gateway answers for this role —
// not by a second role check in the console.
const OPERATOR_ACTIONS = ["read", "history"] as const;

const user = backendMeUser("logistics_operator");
const detail = backendDetailResponse({
  availableActions: [...OPERATOR_ACTIONS],
});
const list = backendPaginatedList({
  data: [backendListItem({ availableActions: [...OPERATOR_ACTIONS] })],
});
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

  test("detail offers no carrier action when the array advertises none", async ({
    page,
  }) => {
    await setupGateway(page);
    await page.goto(`/shipments/${ORDER_PUBLIC_ID}`);

    await expect(
      page.getByText("The backend lists no carrier actions for this shipment", {
        exact: false,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Sync GHN status" }),
    ).toBeDisabled();
    await expect(page.getByText("Syncing is not available for this shipment.")).toBeVisible();

    // Unadvertised actions are absent, not merely disabled.
    await expect(page.getByRole("button", { name: "Cancel shipment" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Return to seller" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Update COD" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Update receiver info" }),
    ).toHaveCount(0);
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

  test("sync page lists no syncable order", async ({ page }) => {
    await setupGateway(page);
    await page.goto("/sync");

    await expect(
      page.getByText("Read-only — no order currently offers the sync action."),
    ).toBeVisible();
    await expect(page.getByText("No syncable orders")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sync", exact: true }),
    ).toHaveCount(0);
  });
});

// risks.md item 22 — generic `admin` is not a GHN console role, but the gateway
// *does* grant it read access to `/api/order/admin/ghn/*`. The guard has to hold
// the checking state until the /403 redirect lands, or the shell paints and its
// React Query hooks fetch real shipment data for the role we mean to bounce.
test("a disallowed role reaches /403 without ever reading the GHN routes", async ({
  page,
}) => {
  const ghnReads: string[] = [];

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/api/user/me") {
      await route.fulfill({ json: { data: backendMeUser("admin") } });
      return;
    }

    // Anything the guard lets through would be a real read for this role.
    ghnReads.push(path);
    await route.fulfill({ json: { data: list } });
  });

  await page.goto("/shipments");

  await expect(page).toHaveURL(/\/403$/);
  await expect(
    page.getByRole("heading", { name: "Access restricted" }),
  ).toBeVisible();
  expect(ghnReads).toEqual([]);
});
