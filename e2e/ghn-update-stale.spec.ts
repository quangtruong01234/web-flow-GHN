import { expect, type Page, test } from "@playwright/test";

import {
  backendListItem,
  backendMeUser,
  backendPaginatedList,
} from "../src/features/ghn-shipping/testing/fixtures";

// The hint is measured against the time the list was fetched, so each test
// freezes the browser clock. 10:00 ICT also keeps the closing-soon notice away.
const NOW = new Date("2026-10-06T10:00:00+07:00");
const STALE_ID = "ord_StaleStaleStale1";
const FRESH_ID = "ord_FreshFreshFresh1";
const CLOSED_ID = "ord_ClosedClosedClo1";
const HINT = "No GHN update in 24h+";

const list = backendPaginatedList({
  data: [
    backendListItem({ orderId: STALE_ID, lastSyncedAt: "2026-10-04T09:00:00+07:00" }),
    backendListItem({ orderId: FRESH_ID, lastSyncedAt: "2026-10-06T08:00:00+07:00" }),
    // Closed on TryBuy's side: no hint however old its last GHN event is.
    backendListItem({
      orderId: CLOSED_ID,
      orderStatus: "canceled",
      lastSyncedAt: "2026-09-01T09:00:00+07:00",
    }),
  ],
  total: 3,
});

/** Mock the gateway and record every non-GET request (a sync is a POST). */
async function setupGateway(
  page: Page,
  role: "logistics_operator" | "shipping_manager",
): Promise<string[]> {
  const writes: string[] = [];

  await page.route("**/gateway-health", async (route) => {
    await route.fulfill({
      json: { status: "online", checkedAt: NOW.toISOString(), httpStatus: 200 },
    });
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() !== "GET") {
      writes.push(`${request.method()} ${path}`);
      await route.fulfill({ status: 404, json: { message: "Not mocked" } });
      return;
    }
    if (path === "/api/user/me") {
      await route.fulfill({ json: { data: backendMeUser(role) } });
      return;
    }
    if (path === "/api/order/admin/ghn/orders") {
      await route.fulfill({ json: { data: list } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Not mocked" } });
  });

  return writes;
}

test.describe("no recent GHN update hint", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(NOW);
  });

  test("marks only the quiet order on /shipments", async ({ page }) => {
    const writes = await setupGateway(page, "logistics_operator");
    await page.goto("/shipments");

    const staleRow = page.getByRole("row").filter({ hasText: `#${STALE_ID}` });
    const freshRow = page.getByRole("row").filter({ hasText: `#${FRESH_ID}` });
    const closedRow = page.getByRole("row").filter({ hasText: `#${CLOSED_ID}` });
    await expect(staleRow.getByText(HINT)).toBeVisible();
    await expect(freshRow).toBeVisible();
    await expect(freshRow.getByText(HINT)).toHaveCount(0);
    await expect(closedRow).toBeVisible();
    await expect(closedRow.getByText(HINT)).toHaveCount(0);
    expect(writes).toEqual([]);
  });

  // A hint, not a trigger: the sync page shows it and still sends nothing until
  // an operator clicks Sync (GHN-FAIL-NTF-01).
  test("marks the quiet order on /sync without syncing it", async ({ page }) => {
    const writes = await setupGateway(page, "shipping_manager");
    await page.goto("/sync");

    await expect(page.getByText(HINT)).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Sync" })).toHaveCount(3);
    expect(writes).toEqual([]);
  });

  test("leaves the frozen sample rows on /demo unmarked", async ({ page }) => {
    await setupGateway(page, "logistics_operator");
    await page.goto("/demo");

    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText(HINT)).toHaveCount(0);
  });
});
