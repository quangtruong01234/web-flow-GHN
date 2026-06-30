import { expect, type Page, test } from "@playwright/test";

const user = {
  id: 2,
  username: "shipmgr_test",
  email: "shipmgr@example.com",
  name: "Shipping Manager",
  avatar: null,
  isActive: true,
  role: {
    rol_id: 2,
    rol_name: "shipping_manager",
    rol_slug: "shipping_manager",
    rol_status: "active",
    rol_description: "",
    rol_grants: [],
  },
  createdAt: "2026-06-27T00:00:00.000Z",
  updatedAt: "2026-06-27T00:00:00.000Z",
};

const detail = {
  localOrder: {
    orderId: 101,
    userId: 7,
    sellerId: 9,
    orderStatus: "delivering",
    ghnOrderCode: "GHN101",
    shippingAddress: "Receiver One|0900000000|12 Nguyen Trai|Ward 1|District 1|HCMC",
    shippingFee: 30000,
    codAmount: 250000,
    paymentMethod: "cod",
    total: 280000,
    items: [
      {
        id: 1,
        orderId: 101,
        productId: 11,
        sellerId: 9,
        productName: "Coffee Beans",
        productImage: null,
        quantity: 2,
        price: 125000,
        weight: null,
        skuId: null,
        skuTierIdx: null,
        skuLabel: "500g",
      },
    ],
    createdAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T09:00:00.000Z",
  },
  ghnDetail: {
    orderCode: "GHN101",
    status: "delivering",
    codAmount: 250000,
    totalFee: 30000,
    expectedDeliveryTime: "2026-06-28T09:00:00.000Z",
    leadtime: "2026-06-28T10:00:00.000Z",
    toName: "Receiver One",
    toPhone: "0900000000",
    toAddress: "12 Nguyen Trai",
    fromName: "TryBuy Warehouse",
    fromPhone: "0900111222",
    raw: {},
  },
  ghnDetailError: null,
  lastGhnStatus: "delivering",
  lastSyncedAt: "2026-06-27T09:30:00.000Z",
  availableActions: ["sync", "cancel", "return", "update_cod", "update_receiver"],
  buyer: { id: 7, username: "buyer1", email: "buyer@example.com", name: "Buyer One" },
  seller: { id: 9, username: "seller1", email: "seller@example.com", name: "Seller One" },
};

const list = {
  data: [
    {
      orderId: 101,
      userId: 7,
      sellerId: 9,
      orderStatus: "delivering",
      ghnOrderCode: "GHN101",
      shippingFee: 30000,
      codAmount: 250000,
      paymentMethod: "cod",
      lastGhnStatus: "delivering",
      lastSyncedAt: "2026-06-27T09:30:00.000Z",
      updatedAt: "2026-06-27T09:00:00.000Z",
      availableActions: ["sync", "cancel", "return", "update_cod", "update_receiver"],
      buyer: detail.buyer,
      seller: detail.seller,
    },
  ],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNext: false,
};

const history = [
  {
    id: 1,
    orderId: 101,
    type: "manual_sync",
    actorId: 2,
    action: "sync",
    previousStatus: "shipped",
    newStatus: "delivering",
    ghnStatus: "delivering",
    success: true,
    message: "Synced from GHN",
    payloadSummary: null,
    createdAt: "2026-06-27T09:30:00.000Z",
  },
];

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
        json: {
          data: {
            orderId: 101,
            previousStatus: "delivering",
            newStatus: "delivering",
            ghnStatus: "delivering",
            syncedAt: "2026-06-27T10:00:00.000Z",
          },
        },
      });
      return;
    }

    if (method === "POST" && path === "/api/order/admin/ghn/orders/101/update-cod") {
      expect(request.postDataJSON()).toEqual({ codAmount: 0 });
      await route.fulfill({
        status: 201,
        json: {
          data: {
            orderId: 101,
            action: "update_cod",
            ghnOrderCode: "GHN101",
            previousCodAmount: 250000,
            newCodAmount: 0,
            success: true,
            message: "COD updated",
            actionedAt: "2026-06-27T10:01:00.000Z",
          },
        },
      });
      return;
    }

    if (method === "POST" && path === "/api/order/admin/ghn/orders/101/update-receiver") {
      expect(request.postDataJSON()).toEqual({ toName: "Receiver Two" });
      await route.fulfill({
        status: 201,
        json: {
          data: {
            orderId: 101,
            action: "update_receiver",
            ghnOrderCode: "GHN101",
            shippingAddress: "Receiver Two|0900000000|12 Nguyen Trai|Ward 1|District 1|HCMC",
            updatedFields: ["toName"],
            success: true,
            message: "Receiver updated",
            actionedAt: "2026-06-27T10:02:00.000Z",
          },
        },
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
          data: {
            orderId: 101,
            previousStatus: "delivering",
            newStatus: "completed",
            ghnStatus: "delivered",
            syncedAt: "2026-06-27T10:03:00.000Z",
          },
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
