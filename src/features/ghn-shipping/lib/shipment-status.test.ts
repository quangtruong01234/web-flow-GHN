import {
  ATTENTION_GHN_META,
  UNKNOWN_GHN_META,
  ghnStatusDistribution,
  rawGhnLabel,
  rawGhnMeta,
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

describe("rawGhnMeta", () => {
  // GHN-FAIL-01: the backend leaves these three without a local status on
  // purpose, so the pill is the only place an operator can notice them.
  it("flags the statuses that need an operator", () => {
    for (const raw of ["exception", "damage", "lost", "  LOST  "]) {
      expect(rawGhnMeta(raw)).toBe(ATTENTION_GHN_META);
    }
  });

  it("stays neutral for an in-transit leg or an absent status", () => {
    expect(rawGhnMeta("money_collect_picking")).toBe(UNKNOWN_GHN_META);
    expect(rawGhnMeta(null)).toBe(UNKNOWN_GHN_META);
    expect(rawGhnMeta(undefined)).toBe(UNKNOWN_GHN_META);
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
