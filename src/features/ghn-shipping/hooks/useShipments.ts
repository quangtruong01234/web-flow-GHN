"use client";

// React Query hooks for GHN shipment read screens + the manual sync mutation.
// Read hooks are enabled by default; write mutations are gated in the UI by the
// gateway's `availableActions` array (role- and state-filtered server-side), not
// by a client-side role check.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import { shipmentsApi } from "../api/shipments";
import { isOrderPublicId } from "../lib/public-ids";
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
  orderId: string | null,
): UseQueryResult<ShipmentDetailView> {
  return useQuery({
    queryKey: queryKeys.shipments.detail(orderId ?? ""),
    queryFn: ({ signal }) => shipmentsApi.detail(orderId ?? "", signal),
    enabled: orderId !== null && isOrderPublicId(orderId),
  });
}

export function useShipmentHistory(
  orderId: string | null,
): UseQueryResult<ShipmentHistoryRow[]> {
  return useQuery({
    queryKey: queryKeys.shipments.history(orderId ?? ""),
    queryFn: ({ signal }) => shipmentsApi.history(orderId ?? "", signal),
    enabled: orderId !== null && isOrderPublicId(orderId),
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
  return useMutation<ShipmentSyncView, Error, string>({
    mutationFn: (orderId: string) => shipmentsApi.sync(orderId),
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
  orderId: string;
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
  orderId: string,
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
  orderId: string;
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
  orderId: string;
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
  orderId: string;
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
