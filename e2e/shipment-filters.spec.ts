import { expect, type Page, test } from "@playwright/test";

import {
  backendDetailResponse,
  backendHistoryRow,
  backendMeUser,
  backendPaginatedList,
  ORDER_PUBLIC_ID,
} from "../src/features/ghn-shipping/testing/fixtures";

const user = backendMeUser("logistics_operator");
const list = backendPaginatedList();
const detail = backendDetailResponse();
const history = [backendHistoryRow({ previousStatus: "shipped" })];

/** Mock the gateway and record the query string of every list request. */
async function setupGateway(page: Page): Promise<URLSearchParams[]> {
  const listQueries: URLSearchParams[] = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() !== "GET") {
      await route.fulfill({ status: 404, json: { message: "Not mocked" } });
      return;
    }
    if (path === "/api/user/me") {
      await route.fulfill({ json: { data: user } });
      return;
    }
    if (path === "/api/order/admin/ghn/orders") {
      listQueries.push(url.searchParams);
      await route.fulfill({ json: { data: list } });
      return;
    }
    if (path === `/api/order/admin/ghn/orders/${ORDER_PUBLIC_ID}`) {
      await route.fulfill({ json: { data: detail } });
      return;
    }
    if (path === `/api/order/admin/ghn/orders/${ORDER_PUBLIC_ID}/history`) {
      await route.fulfill({ json: { data: history } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Not mocked" } });
  });

  return listQueries;
}

test.describe("shipment list filters live in the URL", () => {
  test("Back from a detail page keeps the filter", async ({ page }) => {
    const listQueries = await setupGateway(page);
    await page.goto("/shipments");

    const ghnSelect = page.getByLabel("GHN status");
    await ghnSelect.selectOption("delivery_fail");
    await expect(page).toHaveURL(/\/shipments\?ghnStatus=delivery_fail$/);
    await expect
      .poll(() => listQueries.at(-1)?.get("ghnStatus"))
      .toBe("delivery_fail");

    await page.getByRole("link", { name: `#${ORDER_PUBLIC_ID}` }).click();
    await expect(page).toHaveURL(new RegExp(`/shipments/${ORDER_PUBLIC_ID}$`));

    await page.goBack();
    await expect(page).toHaveURL(/\/shipments\?ghnStatus=delivery_fail$/);
    await expect(page.getByLabel("GHN status")).toHaveValue("delivery_fail");
    expect(listQueries.at(-1)?.get("ghnStatus")).toBe("delivery_fail");
  });

  // The dashboard card is a link, not a filter of its own: it must land on the
  // same URL-held view the list builds, and send the matching request.
  test("a needs-attention tile opens the filtered list", async ({ page }) => {
    const listQueries = await setupGateway(page);
    await page.goto("/dashboard");

    await page.getByRole("link", { name: /^Lost/ }).click();
    await expect(page).toHaveURL(/\/shipments\?ghnStatus=lost$/);
    await expect(page.getByLabel("GHN status")).toHaveValue("lost");
    await expect(page.getByRole("link", { name: /^Lost/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect.poll(() => listQueries.at(-1)?.get("ghnStatus")).toBe("lost");
  });

  // GHN-ENUM-01: a hand-edited link with an unknown value must not reach the
  // gateway as a request that can only answer 400.
  test("a shared link restores valid filters and drops unknown ones", async ({ page }) => {
    const listQueries = await setupGateway(page);
    await page.goto("/shipments?ghnStatus=bogus&status=delivering&hasGhnCode=true");

    await expect(page.getByLabel("Local status")).toHaveValue("delivering");
    await expect(page.getByLabel("GHN status")).toHaveValue("all");
    await expect(page.getByLabel("Only with GHN code")).toBeChecked();

    await expect.poll(() => listQueries.length).toBeGreaterThan(0);
    const query = listQueries.at(-1);
    expect(query?.has("ghnStatus")).toBe(false);
    expect(query?.get("status")).toBe("delivering");
    expect(query?.get("hasGhnCode")).toBe("true");
  });
});
