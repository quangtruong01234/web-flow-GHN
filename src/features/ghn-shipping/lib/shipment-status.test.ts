import {
  UNKNOWN_GHN_META,
  ghnStatusDistribution,
  rawGhnLabel,
} from "./shipment-status";

describe("rawGhnLabel", () => {
  it("prettifies an underscored raw status", () => {
    expect(rawGhnLabel("money_collect_picking")).toBe("Money Collect Picking");
    expect(rawGhnLabel("delivered")).toBe("Delivered");
  });

  it("falls back to the neutral label when empty", () => {
    expect(rawGhnLabel(null)).toBe(UNKNOWN_GHN_META.label);
    expect(rawGhnLabel(undefined)).toBe(UNKNOWN_GHN_META.label);
  });
});

describe("ghnStatusDistribution", () => {
  it("counts items per canonical GHN status and ignores null", () => {
    const dist = ghnStatusDistribution([
      { ghnStatus: "delivering" },
      { ghnStatus: "delivering" },
      { ghnStatus: "delivered" },
      { ghnStatus: null },
    ]);
    const byStatus = Object.fromEntries(dist.map((d) => [d.status, d.count]));
    expect(byStatus.delivering).toBe(2);
    expect(byStatus.delivered).toBe(1);
    expect(byStatus.cancelled).toBe(0);
    // null is not counted in any bucket
    const total = dist.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(3);
  });
});
