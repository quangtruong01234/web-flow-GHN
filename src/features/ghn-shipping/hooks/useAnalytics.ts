"use client";

// React Query hook for the shipping analytics dashboard. Read-only; available
// to logistics_operator as well as shipping_manager/admin (same gate as the
// shipment list), so callers must not gate it behind the manager role.

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import {
  analyticsApi,
  type AnalyticsParams,
  type AnalyticsView,
} from "../api/analytics";

export function useAnalytics(
  params: AnalyticsParams,
  options: { enabled?: boolean } = {},
): UseQueryResult<AnalyticsView> {
  return useQuery({
    queryKey: queryKeys.analytics(params),
    queryFn: ({ signal }) => analyticsApi.get(params, signal),
    placeholderData: (previous) => previous,
    enabled: options.enabled ?? true,
  });
}
