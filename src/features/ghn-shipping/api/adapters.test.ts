import {
  mapGhnStatus,
  mapOrderStatusToLocal,
  toActionView,
  toCodUpdateView,
  toHistoryRow,
  toReceiverUpdateView,
  toShipmentDetailView,
  toShipmentListItem,
} from "./adapters";
import {
  ACTOR_PUBLIC_ID,
  backendActionResult,
  backendBuyer,
  backendCodUpdateResult,
  backendDetailResponse,
  backendHistoryRow,
  backendListItem,
  backendReceiverUpdateResult,
  backendSeller,
  ORDER_PUBLIC_ID,
} from "../testing/fixtures";

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

  // Regression: both used to fall through to `default` and render "Pending",
  // so a refunded order looked like a brand-new one on every console screen.
  it("maps the return/refund statuses instead of falling back to 'pending'", () => {
    expect(mapOrderStatusToLocal("return_requested")).toBe("refunding");
    expect(mapOrderStatusToLocal("refunded")).toBe("refunded");
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
    // Both COD-collection legs, one before the parcel moves and one at the door.
    expect(mapGhnStatus("money_collect_picking")).toBe("picking");
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
    const result = toActionView(
      backendActionResult({
        orderId: ORDER_PUBLIC_ID,
        action: "return",
        ghnOrderCode: "GHN110",
        message: "Return requested",
      }),
    );

    expect(result.action).toBe("return");
    expect(result.previousStatus).toBe("shipping");
    expect(result.newStatus).toBe("cancelled");
    expect(result.success).toBe(true);
  });
});

describe("toCodUpdateView", () => {
  it("passes through the COD amounts and success flag", () => {
    const view = toCodUpdateView(
      backendCodUpdateResult({ orderId: ORDER_PUBLIC_ID, ghnOrderCode: "GHN110" }),
    );
    expect(view.orderId).toBe(ORDER_PUBLIC_ID);
    expect(view.previousCodAmount).toBe(250000);
    expect(view.newCodAmount).toBe(0);
    expect(view.success).toBe(true);
  });
});

describe("toReceiverUpdateView", () => {
  it("passes through the updated fields and shipping address", () => {
    const view = toReceiverUpdateView(
      backendReceiverUpdateResult({
        orderId: ORDER_PUBLIC_ID,
        ghnOrderCode: "GHN110",
        shippingAddress: "Lan|0900000000|12 Lê Lợi|Ward|District|Province",
        updatedFields: ["toName", "toAddress"],
      }),
    );
    expect(view.updatedFields).toEqual(["toName", "toAddress"]);
    expect(view.shippingAddress).toContain("Lê Lợi");
    expect(view.success).toBe(true);
  });
});

describe("toShipmentListItem", () => {
  const base = backendListItem({
    orderId: ORDER_PUBLIC_ID,
    ghnOrderCode: "GHN123",
    availableActions: ["read", "history", "sync"],
    buyer: backendBuyer({ name: "Nguyễn An" }),
    seller: backendSeller({ name: null }),
  });

  it("adapts the row and resolves names with fallbacks", () => {
    const row = toShipmentListItem(base);
    expect(row.orderId).toBe(ORDER_PUBLIC_ID);
    expect(row.localStatus).toBe("shipping");
    expect(row.ghnStatus).toBe("delivering");
    expect(row.buyerName).toBe("Nguyễn An"); // name preferred
    expect(row.sellerName).toBe("seller1"); // null name → username
    expect(row.canSync).toBe(true); // "sync" in availableActions
  });

  it("uses '#id' fallback when the user summary is missing", () => {
    const row = toShipmentListItem({ ...base, buyer: null, seller: null });
    expect(row.buyerName).toBe("Buyer #usr_0000000000000007");
    expect(row.sellerName).toBe("Seller #usr_0000000000000009");
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

// GHN-HIST-01: `actorId` is an opaque `usr_...` id from the deploy onward, but
// audit rows written before it keep their numeric id forever, so the wire type
// stays `string | number | null` and the adapter normalises to a string.
describe("toHistoryRow actorId", () => {
  it("passes an opaque public id through unchanged", () => {
    expect(toHistoryRow(backendHistoryRow()).actorId).toBe(ACTOR_PUBLIC_ID);
  });

  it("stringifies a legacy numeric actor id", () => {
    expect(toHistoryRow(backendHistoryRow({ actorId: 26 })).actorId).toBe("26");
  });

  it("keeps a missing or blank actor as null", () => {
    expect(toHistoryRow(backendHistoryRow({ actorId: null })).actorId).toBeNull();
    expect(toHistoryRow(backendHistoryRow({ actorId: "  " })).actorId).toBeNull();
  });

  it("renders the backend message verbatim without parsing ids out of it", () => {
    const row = toHistoryRow(
      backendHistoryRow({ message: "GHN COD updated from 39 to 39" }),
    );
    expect(row.message).toBe("GHN COD updated from 39 to 39");
  });
});

describe("toShipmentDetailView", () => {
  it("preserves opaque product ids and legacy null references", () => {
    const withPublicId = toShipmentDetailView(backendDetailResponse());
    const withLegacyNull = toShipmentDetailView(
      backendDetailResponse({
        localOrder: {
          ...backendDetailResponse().localOrder,
          items: [
            {
              ...backendDetailResponse().localOrder.items[0],
              productId: null,
            },
          ],
        },
      }),
    );

    expect(withPublicId.items[0].productId).toBe("prod_0000000000000011");
    expect(withLegacyNull.items[0].productId).toBeNull();
  });
});
