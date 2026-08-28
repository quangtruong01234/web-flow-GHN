import { expect, test } from "@playwright/test";

import {
  backendListItem,
  backendMeUser,
  backendPaginatedList,
  ORDER_PUBLIC_ID,
} from "../src/features/ghn-shipping/testing/fixtures";

// risks.md item 21 — the auth cookie is issued with a 5h Max-Age, so it expires
// while the console is open far more often than it does between page loads.
// `/me` runs once on mount, so the expiry can only be noticed through a data
// request: the gateway answers 401 and the console has to return the operator to
// /login carrying the path, not strand them on a Retry button that only re-401s.
//
// Gateway is mocked (no live backend needed) in the same style as
// role-matrix.spec.ts; `sessionAlive` flips to simulate the cookie expiring.
const user = backendMeUser("shipping_manager");
const list = backendPaginatedList({ data: [backendListItem()] });

test("a 401 on a list refetch returns the operator to login with ?next", async ({
  page,
}) => {
  let sessionAlive = true;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/user/me") {
      await route.fulfill(
        sessionAlive
          ? { json: { data: user } }
          : { status: 401, json: { message: "Unauthenticated" } },
      );
      return;
    }

    if (path === "/api/order/admin/ghn/orders") {
      await route.fulfill(
        sessionAlive
          ? { json: { data: list } }
          : { status: 401, json: { message: "Unauthenticated" } },
      );
      return;
    }

    await route.fulfill({ status: 500, json: { message: `Unmocked ${path}` } });
  });

  await page.goto("/shipments");
  await expect(
    page.getByRole("link", { name: `#${ORDER_PUBLIC_ID}` }),
  ).toBeVisible();

  // The cookie expires; the next gateway read is the first thing to notice.
  sessionAlive = false;
  await page.getByPlaceholder("100245 or GHN5A9KQ2H").fill("GHN101");

  await expect(page).toHaveURL(/\/login\?next=%2Fshipments$/);
  await expect(
    page.getByRole("heading", { name: "TryBuy Shipping Admin" }),
  ).toBeVisible();
});
