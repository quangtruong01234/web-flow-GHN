// Server-side liveness probe for the TryBuy gateway.
//
// Why a route handler instead of a browser fetch:
//
//  1. The gateway's health endpoints are the ONE part of its surface that does
//     not live under the `api` prefix — `apps/gateway/src/main.ts` excludes
//     `live`, `ready`, `health` and `metrics` from `setGlobalPrefix("api")`.
//     The dev/prod proxy in `next.config.mjs` only forwards `/api/:path*`, so a
//     browser call to `/api/health` would 404 against this app, and a call to
//     the absolute gateway origin would need CORS. The probe therefore runs on
//     this app's own server, where `API_PROXY_TARGET` is readable.
//  2. This handler deliberately sits OUTSIDE `/api/*`. Everything under `/api`
//     is gateway-owned by convention (.ai/context/data-fetching.md); a local
//     handler there would blur that boundary and shadow the proxy rewrite.
//
// It answers `200` either way: "the backend is down" is the expected answer
// outside the hosting window, not a client error.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Matches the proxy default in `next.config.mjs`. */
const DEFAULT_GATEWAY_ORIGIN = "http://localhost:3000";

const PROBE_TIMEOUT_MS = 3000;

export interface GatewayHealthPayload {
  /** `offline` means the probe failed or the gateway reported itself unusable. */
  status: "online" | "offline";
  /** ISO timestamp of the probe, so the UI can say how fresh the answer is. */
  checkedAt: string;
  /** HTTP status the gateway answered with; `null` when it never answered. */
  httpStatus: number | null;
}

/**
 * Origin of the gateway as seen from this app's server.
 *
 * Proxy mode (the default) puts it in `API_PROXY_TARGET`. Direct mode sets an
 * absolute `NEXT_PUBLIC_API_URL` instead, so fall back to its origin.
 */
function gatewayOrigin(): string {
  const proxyTarget = process.env.API_PROXY_TARGET?.trim();
  if (proxyTarget) return proxyTarget.replace(/\/+$/, "");

  const publicBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicBase && /^https?:\/\//i.test(publicBase)) {
    try {
      return new URL(publicBase).origin;
    } catch {
      return DEFAULT_GATEWAY_ORIGIN;
    }
  }

  return DEFAULT_GATEWAY_ORIGIN;
}

export async function GET(): Promise<NextResponse<GatewayHealthPayload>> {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(`${gatewayOrigin()}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    // The gateway answers 503 when a required dependency is down; a degraded
    // but usable gateway still answers 200. Anything non-OK counts as offline.
    return NextResponse.json({
      status: response.ok ? "online" : "offline",
      checkedAt,
      httpStatus: response.status,
    });
  } catch {
    // Timeout, DNS failure, connection refused — all mean the same thing here.
    // The reason is never surfaced: it would leak the gateway hostname to the
    // browser without telling an operator anything they can act on.
    return NextResponse.json({ status: "offline", checkedAt, httpStatus: null });
  }
}
