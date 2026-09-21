"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import { fetchGatewayHealth, type GatewayHealth } from "@/lib/gateway-health";

/** How often to re-probe while the gateway is down, so the UI recovers by itself. */
const OFFLINE_POLL_MS = 60_000;

export interface GatewayHealthState {
  /** `unknown` until the first probe settles — never render "offline" on it. */
  status: "unknown" | "online" | "offline";
  isOffline: boolean;
  checkedAt: string | null;
}

/**
 * Shared gateway liveness state. One React Query entry backs every consumer, so
 * the banner and the screens agree and only one probe is in flight.
 *
 * The poll is on the local `/gateway-health` handler, not on any GHN endpoint.
 * Polling a GHN route would be a contract violation: `POST .../sync` notifies a
 * buyer the first time it records a failed delivery (GHN-FAIL-NTF-01), which is
 * why `.ai/context/domain.md` bans loops over it. A liveness probe has no such
 * side effect.
 */
export function useGatewayHealth(): GatewayHealthState {
  const { data } = useQuery<GatewayHealth>({
    queryKey: queryKeys.gatewayHealth,
    queryFn: ({ signal }) => fetchGatewayHealth(signal),
    // `fetchGatewayHealth` resolves rather than throws, so a retry would only
    // repeat a settled answer.
    retry: false,
    staleTime: OFFLINE_POLL_MS,
    refetchInterval: (query) =>
      query.state.data?.status === "offline" ? OFFLINE_POLL_MS : false,
    refetchOnWindowFocus: true,
  });

  return {
    status: data?.status ?? "unknown",
    isOffline: data?.status === "offline",
    checkedAt: data?.checkedAt ?? null,
  };
}
