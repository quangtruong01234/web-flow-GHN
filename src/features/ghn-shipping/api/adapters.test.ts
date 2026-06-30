import {
  mapGhnStatus,
  mapOrderStatusToLocal,
  toActionView,
  toCodUpdateView,
  toReceiverUpdateView,
  toShipmentListItem,
} from "./adapters";
import type { BackendGhnListItem } from "./types";

describe("mapOrderStatusToLocal", () => {
  it("maps in-transit backend statuses to 'shipping'", () => {
    expect(mapOrderStatusToLocal("processing")).toBe("shipping");
    expect(mapOrderStatusToLocal("shipped")).toBe("shipping");
    expect(mapOrderStatusToLocal("delivering")).toBe("shipping");
  });

  it("maps terminal and direct statuses", () => {
    expect(mapOrderStatusToLocal("completed")).toBe("completed");
    expect(mapOrderStatusToLocal("canceled")).toBe("cancelled");
    expect(mapOrderStatusToLocal("confirmed")).toBe("confirmed");
  });

  it("falls back to 'pending' for null/undefined", () => {
    expect(mapOrderStatusToLocal(null)).toBe("pending");
    expect(mapOrderStatusToLocal(undefined)).toBe("pending");
  });
});

describe("mapGhnStatus", () => {
  it("maps known aliases to the canonical GHN status", () => {
    expect(mapGhnStatus("picked")).toBe("picking");
    expect(mapGhnStatus("transporting")).toBe("delivering");
    expect(mapGhnStatus("money_collect_delivering")).toBe("delivering");
    expect(mapGhnStatus("return")).toBe("waiting_to_return");
    expect(mapGhnStatus("return_transporting")).toBe("waiting_to_return");
    expect(mapGhnStatus("return_sorting")).toBe("waiting_to_return");
    expect(mapGhnStatus("cancel")).toBe("cancelled");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(mapGhnStatus("  DELIVERED ")).toBe("delivered");
  });

  it("returns null for empty or unrecognised input (never guesses)", () => {
    expect(mapGhnStatus(null)).toBeNull();
    expect(mapGhnStatus("")).toBeNull();
    expect(mapGhnStatus("some_future_ghn_state")).toBeNull();
  });
});

describe("toActionView", () => {
  it("adapts cancel/return results and maps backend canceled to local cancelled", () => {
    const result = toActionView({
      orderId: 110,
      action: "return",
      ghnOrderCode: "GHN110",
      previousStatus: "delivering",
      newStatus: "canceled",
      success: true,
      message: "Return requested",
      actionedAt: "2026-06-28T04:00:00.000Z",
    });

    expect(result.action).toBe("return");
    expect(result.previousStatus).toBe("shipping");
    expect(result.newStatus).toBe("cancelled");
    expect(result.success).toBe(true);
  });
});

describe("toCodUpdateView", () => {
  it("passes through the COD amounts and success flag", () => {
    const view = toCodUpdateView({
      orderId: 110,
      action: "update_cod",
      ghnOrderCode: "GHN110",
      previousCodAmount: 250000,
      newCodAmount: 0,
      success: true,
      message: "COD updated",
      actionedAt: "2026-06-28T04:00:00.000Z",
    });
    expect(view.orderId).toBe(110);
    expect(view.previousCodAmount).toBe(250000);
    expect(view.newCodAmount).toBe(0);
    expect(view.success).toBe(true);
  });
});

describe("toReceiverUpdateView", () => {
  it("passes through the updated fields and shipping address", () => {
    const view = toReceiverUpdateView({
      orderId: 110,
      action: "update_receiver",
      ghnOrderCode: "GHN110",
      shippingAddress: "Lan|0900000000|12 Lê Lợi|Ward|District|Province",
      updatedFields: ["toName", "toAddress"],
      success: true,
      message: "Receiver updated",
      actionedAt: "2026-06-28T04:00:00.000Z",
    });
    expect(view.updatedFields).toEqual(["toName", "toAddress"]);
    expect(view.shippingAddress).toContain("Lê Lợi");
    expect(view.success).toBe(true);
  });
});

describe("toShipmentListItem", () => {
  const base: BackendGhnListItem = {
    orderId: 42,
    userId: 7,
    sellerId: 9,
    orderStatus: "delivering",
    ghnOrderCode: "GHN123",
    shippingFee: 30000,
    codAmount: 250000,
    paymentMethod: "cod",
    lastGhnStatus: "delivering",
    lastSyncedAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T09:00:00.000Z",
    availableActions: ["read", "history", "sync"],
    buyer: { id: 7, username: "buyer1", email: "b@x.com", name: "Nguyễn An" },
    seller: { id: 9, username: "seller1", email: "s@x.com", name: null },
  };

  it("adapts the row and resolves names with fallbacks", () => {
    const row = toShipmentListItem(base);
    expect(row.orderId).toBe(42);
    expect(row.localStatus).toBe("shipping");
    expect(row.ghnStatus).toBe("delivering");
    expect(row.buyerName).toBe("Nguyễn An"); // name preferred
    expect(row.sellerName).toBe("seller1"); // null name → username
    expect(row.canSync).toBe(true); // "sync" in availableActions
  });

  it("uses '#id' fallback when the user summary is missing", () => {
    const row = toShipmentListItem({ ...base, buyer: null, seller: null });
    expect(row.buyerName).toBe("Buyer #7");
    expect(row.sellerName).toBe("Seller #9");
  });

  it("cannot sync without a sync action, and keeps unmapped GHN status raw", () => {
    const row = toShipmentListItem({
      ...base,
      availableActions: ["read", "history"],
      lastGhnStatus: "weird_state",
    });
    expect(row.canSync).toBe(false);
    expect(row.ghnStatus).toBeNull();
    expect(row.rawGhnStatus).toBe("weird_state");
  });
});
