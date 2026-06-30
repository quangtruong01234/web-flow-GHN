"use client";

// React Query hooks for GHN shipment read screens + the manual sync mutation.
// Read hooks are enabled by default; the sync mutation is the only write and is
// gated in the UI by `canSync` from the auth context (shipping_manager).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import { shipmentsApi } from "../api/shipments";
import type {
  SetDemoStatusInput,
  ShipmentCodUpdateView,
  ShipmentDetailView,
  ShipmentHistoryRow,
  ShipmentActionView,
  ShipmentListParams,
  ShipmentListView,
  ShipmentManualAction,
  ShipmentReceiverUpdateView,
  ShipmentSyncView,
  UpdateCodInput,
  UpdateReceiverInput,
} from "../api/types";

export function useShipmentList(
  params: ShipmentListParams,
): UseQueryResult<ShipmentListView> {
  return useQuery({
    queryKey: queryKeys.shipments.list(params),
    queryFn: ({ signal }) => shipmentsApi.list(params, signal),
    placeholderData: (previous) => previous,
  });
}

export function useShipmentDetail(
  orderId: number | null,
): UseQueryResult<ShipmentDetailView> {
  return useQuery({
    queryKey: queryKeys.shipments.detail(orderId ?? -1),
    queryFn: ({ signal }) => shipmentsApi.detail(orderId ?? -1, signal),
    enabled: orderId !== null && Number.isFinite(orderId) && orderId > 0,
  });
}

export function useShipmentHistory(
  orderId: number | null,
): UseQueryResult<ShipmentHistoryRow[]> {
  return useQuery({
    queryKey: queryKeys.shipments.history(orderId ?? -1),
    queryFn: ({ signal }) => shipmentsApi.history(orderId ?? -1, signal),
    enabled: orderId !== null && Number.isFinite(orderId) && orderId > 0,
  });
}

/**
 * Manual GHN sync. On success, invalidate the affected order's detail/history
 * and every shipment list so the new status propagates. This is a real backend
 * mutation (it records shipping history); only render its trigger when the user
 * may sync.
 */
export function useSyncShipment() {
  const queryClient = useQueryClient();
  return useMutation<ShipmentSyncView, Error, number>({
    mutationFn: (orderId: number) => shipmentsApi.sync(orderId),
    onSuccess: (_result, orderId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(orderId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.history(orderId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.all,
      });
    },
  });
}

interface ShipmentActionInput {
  orderId: number;
  action: ShipmentManualAction;
}

export function useShipmentAction() {
  const queryClient = useQueryClient();
  return useMutation<ShipmentActionView, Error, ShipmentActionInput>({
    mutationFn: ({ orderId, action }) => shipmentsApi.action(orderId, action),
    onSuccess: (_result, { orderId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(orderId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.history(orderId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.all,
      });
    },
  });
}

function invalidateOrder(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: number,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.shipments.detail(orderId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.shipments.history(orderId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.shipments.all,
  });
}

interface UpdateCodInputArgs {
  orderId: number;
  body: UpdateCodInput;
}

/** Correct a live waybill's COD amount (`shipping_manager`/admin only). */
export function useUpdateCod() {
  const queryClient = useQueryClient();
  return useMutation<ShipmentCodUpdateView, Error, UpdateCodInputArgs>({
    mutationFn: ({ orderId, body }) => shipmentsApi.updateCod(orderId, body),
    onSuccess: (_result, { orderId }) => invalidateOrder(queryClient, orderId),
  });
}

interface UpdateReceiverInputArgs {
  orderId: number;
  body: UpdateReceiverInput;
}

/** Correct a live waybill's receiver name/phone/street (`shipping_manager`/admin only). */
export function useUpdateReceiver() {
  const queryClient = useQueryClient();
  return useMutation<ShipmentReceiverUpdateView, Error, UpdateReceiverInputArgs>({
    mutationFn: ({ orderId, body }) =>
      shipmentsApi.updateReceiver(orderId, body),
    onSuccess: (_result, { orderId }) => invalidateOrder(queryClient, orderId),
  });
}

interface SetDemoStatusInputArgs {
  orderId: number;
  body: SetDemoStatusInput;
}

/**
 * DEMO ONLY: drive the GHN status end-to-end for demos. Same result shape and
 * invalidation as a real sync; the trigger is gated in the UI behind the demo
 * build flag (`NEXT_PUBLIC_GHN_DEMO_MODE`) + `shipping_manager`/admin role.
 * Requires the backend demo flag (`GHN_DEMO_ENDPOINTS_ENABLED`) — `403` otherwise.
 */
export function useSetDemoStatus() {
  const queryClient = useQueryClient();
  return useMutation<ShipmentSyncView, Error, SetDemoStatusInputArgs>({
    mutationFn: ({ orderId, body }) => shipmentsApi.setDemoStatus(orderId, body),
    onSuccess: (_result, { orderId }) => invalidateOrder(queryClient, orderId),
  });
}
