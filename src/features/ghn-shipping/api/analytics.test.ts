import {
  ANALYTICS_STATUS_KEYS,
  toAnalyticsView,
  type BackendAnalyticsResponse,
} from "./analytics";

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
      { productId: 7, productName: "Áo thun", quantitySold: 12, revenue: 3_600_000 },
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
      { productId: 7, name: "Áo thun", quantitySold: 12, revenue: 3_600_000 },
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
