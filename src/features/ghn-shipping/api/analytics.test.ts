import {
  ANALYTICS_STATUS_KEYS,
  toAnalyticsView,
  type BackendAnalyticsResponse,
} from "./analytics";

/** IDLEAK-02: analytics carries the opaque product public id, not a numeric PK. */
const PRODUCT_PUBLIC_ID = "prod_ffc7fc2281d211f1";

function backendResponse(
  overrides: Partial<BackendAnalyticsResponse> = {},
): BackendAnalyticsResponse {
  return {
    scope: "global",
    from: "2026-06-01T00:00:00.000Z",
    to: "2026-06-30T23:59:59.999Z",
    interval: "day",
    summary: {
      totalRevenue: 12_500_000,
      completedOrders: 25,
      totalOrders: 40,
      averageOrderValue: 500_000,
    },
    revenueOverTime: [
      { period: "2026-06-01", revenue: 1_000_000, orderCount: 2 },
      { period: "2026-06-02", revenue: 0, orderCount: 0 },
    ],
    statusDistribution: {
      pending: 5,
      confirmed: 3,
      processing: 2,
      shipped: 4,
      delivering: 1,
      completed: 25,
      canceled: 0,
      return_requested: 0,
      refunded: 0,
    },
    topProducts: [
      {
        productId: PRODUCT_PUBLIC_ID,
        productName: "Áo thun",
        quantitySold: 12,
        revenue: 3_600_000,
      },
    ],
    ...overrides,
  };
}

describe("toAnalyticsView", () => {
  it("passes summary, range, and revenue points through", () => {
    const view = toAnalyticsView(backendResponse());
    expect(view.interval).toBe("day");
    expect(view.summary).toEqual({
      totalRevenue: 12_500_000,
      completedOrders: 25,
      totalOrders: 40,
      averageOrderValue: 500_000,
    });
    expect(view.revenueOverTime).toEqual([
      { period: "2026-06-01", revenue: 1_000_000, orderCount: 2 },
      { period: "2026-06-02", revenue: 0, orderCount: 0 },
    ]);
    expect(view.topProducts).toEqual([
      {
        productId: PRODUCT_PUBLIC_ID,
        name: "Áo thun",
        quantitySold: 12,
        revenue: 3_600_000,
      },
    ]);
  });

  it("returns one ordered distribution row per known status with labels", () => {
    const view = toAnalyticsView(backendResponse());
    expect(view.statusDistribution.map((row) => row.status)).toEqual([
      ...ANALYTICS_STATUS_KEYS,
    ]);
    const completed = view.statusDistribution.find(
      (row) => row.status === "completed",
    );
    expect(completed).toMatchObject({ label: "Completed", count: 25 });
    expect(completed?.barClass).toBeTruthy();
  });

  // GHN-RBAC-01: a role without revenue visibility gets a 200 with the four
  // monetary fields OMITTED (not zeroed). Zero would read as "sold nothing".
  it("reports revenue as hidden when the backend omits the monetary fields", () => {
    const full = backendResponse();
    const view = toAnalyticsView({
      ...full,
      summary: {
        completedOrders: full.summary.completedOrders,
        totalOrders: full.summary.totalOrders,
      },
      revenueOverTime: [{ period: "2026-06-01", orderCount: 2 }],
      topProducts: [
        {
          productId: PRODUCT_PUBLIC_ID,
          productName: "Áo thun",
          quantitySold: 12,
        },
      ],
    });

    expect(view.revenueVisible).toBe(false);
    expect(view.summary).toEqual({
      totalRevenue: null,
      completedOrders: 25,
      totalOrders: 40,
      averageOrderValue: null,
    });
    expect(view.revenueOverTime).toEqual([
      { period: "2026-06-01", revenue: null, orderCount: 2 },
    ]);
    expect(view.topProducts).toEqual([
      {
        productId: PRODUCT_PUBLIC_ID,
        name: "Áo thun",
        quantitySold: 12,
        revenue: null,
      },
    ]);
  });

  // IDLEAK-02: `productId` is an opaque `prod_...` id, `null` when the product
  // no longer resolves, and still numeric if this console deploys ahead of the
  // backend. All three must survive the view model.
  describe("topProducts productId", () => {
    it("passes an opaque public id through unchanged", () => {
      const view = toAnalyticsView(backendResponse());
      expect(view.topProducts[0].productId).toBe(PRODUCT_PUBLIC_ID);
    });

    it("keeps an unresolved product as null instead of a stringified placeholder", () => {
      const view = toAnalyticsView(
        backendResponse({
          topProducts: [
            { productId: null, productName: "Đã xoá", quantitySold: 3 },
            { productId: null, productName: "Đã xoá 2", quantitySold: 1 },
          ],
        }),
      );
      expect(view.topProducts.map((product) => product.productId)).toEqual([
        null,
        null,
      ]);
    });

    it("stringifies a legacy numeric product id", () => {
      const view = toAnalyticsView(
        backendResponse({
          topProducts: [
            { productId: 7, productName: "Áo thun", quantitySold: 12 },
          ],
        }),
      );
      expect(view.topProducts[0].productId).toBe("7");
    });
  });

  it("reports revenue as visible when the money fields are present", () => {
    expect(toAnalyticsView(backendResponse()).revenueVisible).toBe(true);
  });

  it("defaults missing distribution keys and absent arrays to empty/zero", () => {
    const view = toAnalyticsView(
      backendResponse({
        statusDistribution: {
          pending: 1,
        } as BackendAnalyticsResponse["statusDistribution"],
        revenueOverTime: undefined as unknown as [],
        topProducts: undefined as unknown as [],
      }),
    );
    expect(view.revenueOverTime).toEqual([]);
    expect(view.topProducts).toEqual([]);
    const refunded = view.statusDistribution.find(
      (row) => row.status === "refunded",
    );
    expect(refunded?.count).toBe(0);
    const pending = view.statusDistribution.find((row) => row.status === "pending");
    expect(pending?.count).toBe(1);
  });
});
