// GHN shipment API calls. Every call goes through the gateway via `request<T>`
// (cookie auth, envelope unwrapping). Responses are returned adapted to FE view
// models; raw backend types stay internal to this module + adapters.

import { request } from "@/lib/api";
import {
  toActionView,
  toCodUpdateView,
  toHistoryRow,
  toReceiverUpdateView,
  toShipmentDetailView,
  toShipmentListView,
  toSyncView,
} from "./adapters";
import type {
  BackendActionResult,
  BackendGhnDetailResponse,
  BackendGhnListItem,
  BackendPaginated,
  BackendShippingHistory,
  BackendSyncResult,
  BackendUpdateCodResult,
  BackendUpdateReceiverResult,
  ShipmentActionView,
  ShipmentCodUpdateView,
  ShipmentDetailView,
  ShipmentHistoryRow,
  ShipmentListParams,
  ShipmentListView,
  ShipmentManualAction,
  SetDemoStatusInput,
  ShipmentReceiverUpdateView,
  ShipmentSyncView,
  UpdateCodInput,
  UpdateReceiverInput,
} from "./types";

const BASE = "/order/admin/ghn/orders";

export const shipmentsApi = {
  async list(
    params: ShipmentListParams = {},
    signal?: AbortSignal,
  ): Promise<ShipmentListView> {
    const res = await request<BackendPaginated<BackendGhnListItem>>(BASE, {
      query: {
        page: params.page,
        limit: params.limit,
        status: params.status,
        ghnStatus: params.ghnStatus,
        hasGhnCode: params.hasGhnCode,
        search: params.search,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
      signal,
    });
    return toShipmentListView(res);
  },

  async detail(
    orderId: number,
    signal?: AbortSignal,
  ): Promise<ShipmentDetailView> {
    const res = await request<BackendGhnDetailResponse>(`${BASE}/${orderId}`, {
      signal,
    });
    return toShipmentDetailView(res);
  },

  async history(
    orderId: number,
    signal?: AbortSignal,
  ): Promise<ShipmentHistoryRow[]> {
    const res = await request<BackendShippingHistory[]>(
      `${BASE}/${orderId}/history`,
      { signal },
    );
    return res.map(toHistoryRow);
  },

  async sync(orderId: number): Promise<ShipmentSyncView> {
    const res = await request<BackendSyncResult>(`${BASE}/${orderId}/sync`, {
      method: "POST",
    });
    return toSyncView(res);
  },

  async action(
    orderId: number,
    action: ShipmentManualAction,
  ): Promise<ShipmentActionView> {
    const res = await request<BackendActionResult>(`${BASE}/${orderId}/${action}`, {
      method: "POST",
    });
    return toActionView(res);
  },

  async updateCod(
    orderId: number,
    body: UpdateCodInput,
  ): Promise<ShipmentCodUpdateView> {
    const res = await request<BackendUpdateCodResult>(
      `${BASE}/${orderId}/update-cod`,
      { method: "POST", body },
    );
    return toCodUpdateView(res);
  },

  async updateReceiver(
    orderId: number,
    body: UpdateReceiverInput,
  ): Promise<ShipmentReceiverUpdateView> {
    const res = await request<BackendUpdateReceiverResult>(
      `${BASE}/${orderId}/update-receiver`,
      { method: "POST", body },
    );
    return toReceiverUpdateView(res);
  },

  /**
   * DEMO ONLY: drive the GHN status for end-to-end demos. Returns the same shape
   * as `sync`, so it reuses `toSyncView`. Requires the backend demo flag enabled
   * (`403` otherwise). Never calls GHN directly — the backend simulates it.
   */
  async setDemoStatus(
    orderId: number,
    body: SetDemoStatusInput,
  ): Promise<ShipmentSyncView> {
    const res = await request<BackendSyncResult>(
      `${BASE}/${orderId}/demo-status`,
      { method: "POST", body },
    );
    return toSyncView(res);
  },
};
