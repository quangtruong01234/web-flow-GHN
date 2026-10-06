import {
  ATTENTION_GHN_META,
  UNKNOWN_GHN_META,
  ghnStatusDistribution,
  isGhnUpdateStale,
  needsAttentionCounts,
  needsAttentionMeta,
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

describe("needsAttentionCounts", () => {
  // `exception`/`damage`/`lost` are not `GhnStatus` values, so `ghnStatus` is
  // null for them — the count has to read the raw status.
  it("counts the current status, raw first", () => {
    const counts = needsAttentionCounts([
      { ghnStatus: "delivery_fail", rawGhnStatus: "delivery_fail" },
      { ghnStatus: "delivery_fail", rawGhnStatus: null },
      { ghnStatus: null, rawGhnStatus: "  LOST " },
      { ghnStatus: null, rawGhnStatus: "exception" },
      { ghnStatus: "delivering", rawGhnStatus: "delivering" },
      { ghnStatus: null, rawGhnStatus: null },
    ]);
    expect(counts).toEqual({ delivery_fail: 2, exception: 1, damage: 0, lost: 1 });
  });
});

describe("needsAttentionMeta", () => {
  it("reuses the GHN pill for a failed attempt and the red one for the rest", () => {
    expect(needsAttentionMeta("delivery_fail").label).toBe("Delivery failed");
    expect(needsAttentionMeta("damage")).toEqual(
      expect.objectContaining({ label: "Damage", dotClass: ATTENTION_GHN_META.dotClass }),
    );
  });
});

describe("isGhnUpdateStale", () => {
  const asOf = Date.parse("2026-10-06T12:00:00Z");
  const moving = {
    ghnOrderCode: "GHN101",
    ghnStatus: "delivering" as const,
    localStatus: "shipping" as const,
    lastSyncedAt: "2026-10-05T11:59:59Z",
    updatedAt: "2026-10-01T08:00:00Z",
  };

  it("flags an open, moving order with no GHN update for 24h or more", () => {
    expect(isGhnUpdateStale(moving, asOf)).toBe(true);
    expect(isGhnUpdateStale({ ...moving, lastSyncedAt: "2026-10-05T12:00:00Z" }, asOf)).toBe(true);
    // exception/damage/lost map to a null `ghnStatus` — still moving, still flagged.
    expect(isGhnUpdateStale({ ...moving, ghnStatus: null }, asOf)).toBe(true);
  });

  it("stays quiet inside 24h", () => {
    expect(isGhnUpdateStale({ ...moving, lastSyncedAt: "2026-10-05T12:00:01Z" }, asOf)).toBe(false);
  });

  // No history row yet: measure from the order's own last change, so a waybill
  // created minutes ago is not flagged.
  it("falls back to updatedAt when no GHN update was ever recorded", () => {
    expect(isGhnUpdateStale({ ...moving, lastSyncedAt: null }, asOf)).toBe(true);
    expect(
      isGhnUpdateStale(
        { ...moving, lastSyncedAt: null, updatedAt: "2026-10-06T11:00:00Z" },
        asOf,
      ),
    ).toBe(false);
  });

  it("ignores orders with no GHN code or a terminal GHN status", () => {
    expect(isGhnUpdateStale({ ...moving, ghnOrderCode: null }, asOf)).toBe(false);
    expect(isGhnUpdateStale({ ...moving, ghnStatus: "delivered" }, asOf)).toBe(false);
    expect(isGhnUpdateStale({ ...moving, ghnStatus: "returned" }, asOf)).toBe(false);
    expect(isGhnUpdateStale({ ...moving, ghnStatus: "cancelled" }, asOf)).toBe(false);
  });

  it("ignores orders already closed on TryBuy's side", () => {
    expect(isGhnUpdateStale({ ...moving, localStatus: "completed" }, asOf)).toBe(false);
    expect(isGhnUpdateStale({ ...moving, localStatus: "cancelled" }, asOf)).toBe(false);
    expect(isGhnUpdateStale({ ...moving, localStatus: "refunded" }, asOf)).toBe(false);
    expect(isGhnUpdateStale({ ...moving, localStatus: "refunding" }, asOf)).toBe(true);
  });

  it("does not guess when the timestamp is unreadable", () => {
    expect(isGhnUpdateStale({ ...moving, lastSyncedAt: "not a date" }, asOf)).toBe(false);
  });
});
