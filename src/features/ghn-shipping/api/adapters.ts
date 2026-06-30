// Pure adapters: backend gateway shapes -> FE view models. No fetching here.
//
// Status mapping mirrors the backend's own GHN->order mapping where it exists
// and stays conservative elsewhere: an unrecognised GHN status maps to `null`
// (the UI then shows the raw string) rather than guessing a wrong enum. GHN
// status is backend-owned; we never invent a state the backend did not report.

import type { GhnStatus, LocalStatus } from "../types";
import type {
  BackendGhnDetailResponse,
  BackendGhnListItem,
  BackendActionResult,
  BackendOrderItem,
  BackendOrderStatus,
  BackendPaginated,
  BackendShippingHistory,
  BackendSyncResult,
  BackendUpdateCodResult,
  BackendUpdateReceiverResult,
  BackendUserSummary,
  ShipmentActionView,
  ShipmentCodUpdateView,
  ShipmentDetailItemView,
  ShipmentDetailView,
  ShipmentHistoryRow,
  ShipmentListItem,
  ShipmentListView,
  ShipmentReceiverUpdateView,
  ShipmentReceiverView,
  ShipmentSyncView,
} from "./types";

/** Map backend `OrderStatus` to the FE `LocalStatus`. */
export function mapOrderStatusToLocal(
  status: BackendOrderStatus | null | undefined,
): LocalStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "processing":
    case "shipped":
    case "delivering":
      return "shipping";
    case "completed":
      return "completed";
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

const GHN_STATUS_ALIASES: Record<string, GhnStatus> = {
  ready_to_pick: "ready_to_pick",
  picking: "picking",
  picked: "picking",
  storing: "picking",
  sorting: "picking",
  transporting: "delivering",
  delivering: "delivering",
  money_collect_delivering: "delivering",
  delivered: "delivered",
  delivery_fail: "delivery_fail",
  delivered_fail: "delivery_fail",
  waiting_to_return: "waiting_to_return",
  return: "waiting_to_return",
  returning: "waiting_to_return",
  return_transporting: "waiting_to_return",
  return_sorting: "waiting_to_return",
  returned: "returned",
  return_fail: "returned",
  cancel: "cancelled",
  cancelled: "cancelled",
  canceled: "cancelled",
};

/** Map a raw GHN status string to the FE `GhnStatus`, or null if unrecognised. */
export function mapGhnStatus(
  raw: string | null | undefined,
): GhnStatus | null {
  if (!raw) return null;
  return GHN_STATUS_ALIASES[raw.trim().toLowerCase()] ?? null;
}

function userName(
  user: BackendUserSummary | null,
  fallbackId: number,
  kind: "Buyer" | "Seller",
): string {
  if (user) return user.name?.trim() || user.username || `${kind} #${user.id}`;
  return `${kind} #${fallbackId}`;
}

export function toShipmentListItem(
  item: BackendGhnListItem,
): ShipmentListItem {
  return {
    orderId: item.orderId,
    ghnOrderCode: item.ghnOrderCode,
    buyerName: userName(item.buyer, item.userId, "Buyer"),
    sellerName: userName(item.seller, item.sellerId, "Seller"),
    localStatus: mapOrderStatusToLocal(item.orderStatus),
    ghnStatus: mapGhnStatus(item.lastGhnStatus),
    rawGhnStatus: item.lastGhnStatus,
    codAmount: item.codAmount,
    shippingFee: item.shippingFee,
    paymentMethod: item.paymentMethod,
    lastSyncedAt: item.lastSyncedAt,
    updatedAt: item.updatedAt,
    canSync: item.availableActions.includes("sync"),
    availableActions: item.availableActions,
  };
}

export function toShipmentListView(
  res: BackendPaginated<BackendGhnListItem>,
): ShipmentListView {
  return {
    items: res.data.map(toShipmentListItem),
    total: res.total,
    page: res.page,
    limit: res.limit,
    totalPages: res.totalPages,
    hasNext: res.hasNext,
  };
}

/**
 * Best-effort receiver: the local order stores it as a pipe-delimited string
 * `name|phone|address|ward|district|province`; GHN detail (when present)
 * carries authoritative name/phone/address.
 */
function parseReceiver(
  shippingAddress: string,
  ghn: BackendGhnDetailResponse["ghnDetail"],
): ShipmentReceiverView {
  const [name = "", phone = "", address = "", ward = "", district = "", province = ""] =
    (shippingAddress ?? "").split("|").map((part) => part.trim());
  return {
    name: ghn?.toName?.trim() || name,
    phone: ghn?.toPhone?.trim() || phone,
    address: ghn?.toAddress?.trim() || address,
    ward,
    district,
    province,
  };
}

function toDetailItem(item: BackendOrderItem): ShipmentDetailItemView {
  return {
    id: item.id,
    name: item.productName,
    image: item.productImage,
    quantity: item.quantity,
    unitPrice: Number(item.price) || 0,
    skuLabel: item.skuLabel,
  };
}

function summarizeItems(items: ShipmentDetailItemView[]): string {
  if (items.length === 0) return "—";
  const first = items[0];
  const head = `${first.name}${first.quantity > 1 ? ` ×${first.quantity}` : ""}`;
  return items.length === 1 ? head : `${head} +${items.length - 1} more`;
}

export function toShipmentDetailView(
  res: BackendGhnDetailResponse,
): ShipmentDetailView {
  const { localOrder, ghnDetail } = res;
  const items = (localOrder.items ?? []).map(toDetailItem);
  const rawGhn = ghnDetail?.status ?? res.lastGhnStatus;
  return {
    orderId: localOrder.orderId,
    ghnOrderCode: localOrder.ghnOrderCode,
    localStatus: mapOrderStatusToLocal(localOrder.orderStatus),
    ghnStatus: mapGhnStatus(rawGhn),
    rawGhnStatus: rawGhn,
    buyerName: userName(res.buyer, localOrder.userId, "Buyer"),
    buyerEmail: res.buyer?.email ?? null,
    sellerName: userName(res.seller, localOrder.sellerId, "Seller"),
    receiver: parseReceiver(localOrder.shippingAddress, ghnDetail),
    paymentMethod: localOrder.paymentMethod,
    codAmount: localOrder.codAmount ?? 0,
    shippingFee: localOrder.shippingFee ?? 0,
    total: localOrder.total,
    items,
    productSummary: summarizeItems(items),
    createdAt: localOrder.createdAt,
    updatedAt: localOrder.updatedAt,
    lastSyncedAt: res.lastSyncedAt,
    ghn: ghnDetail
      ? {
          expected: ghnDetail.expectedDeliveryTime,
          leadtime: ghnDetail.leadtime,
          totalFee: ghnDetail.totalFee,
          fromName: ghnDetail.fromName,
          fromPhone: ghnDetail.fromPhone,
        }
      : null,
    ghnDetailError: res.ghnDetailError,
    canSync: res.availableActions.includes("sync"),
    availableActions: res.availableActions,
  };
}

export function toHistoryRow(row: BackendShippingHistory): ShipmentHistoryRow {
  return {
    id: row.id,
    type: row.type,
    action: row.action,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    ghnStatus: row.ghnStatus,
    success: row.success,
    message: row.message,
    actorId: row.actorId,
    createdAt: row.createdAt,
  };
}

export function toSyncView(res: BackendSyncResult): ShipmentSyncView {
  return {
    orderId: res.orderId,
    previousStatus: mapOrderStatusToLocal(res.previousStatus),
    newStatus: mapOrderStatusToLocal(res.newStatus),
    ghnStatus: res.ghnStatus,
    syncedAt: res.syncedAt,
  };
}

export function toActionView(res: BackendActionResult): ShipmentActionView {
  return {
    orderId: res.orderId,
    action: res.action,
    ghnOrderCode: res.ghnOrderCode,
    previousStatus: mapOrderStatusToLocal(res.previousStatus),
    newStatus: mapOrderStatusToLocal(res.newStatus),
    success: res.success,
    message: res.message,
    actionedAt: res.actionedAt,
  };
}

export function toCodUpdateView(
  res: BackendUpdateCodResult,
): ShipmentCodUpdateView {
  return {
    orderId: res.orderId,
    ghnOrderCode: res.ghnOrderCode,
    previousCodAmount: res.previousCodAmount,
    newCodAmount: res.newCodAmount,
    success: res.success,
    message: res.message,
    actionedAt: res.actionedAt,
  };
}

export function toReceiverUpdateView(
  res: BackendUpdateReceiverResult,
): ShipmentReceiverUpdateView {
  return {
    orderId: res.orderId,
    ghnOrderCode: res.ghnOrderCode,
    shippingAddress: res.shippingAddress,
    updatedFields: res.updatedFields,
    success: res.success,
    message: res.message,
    actionedAt: res.actionedAt,
  };
}
