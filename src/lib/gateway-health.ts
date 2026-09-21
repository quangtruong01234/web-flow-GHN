// Client half of the gateway liveness probe. Deliberately NOT routed through
// `lib/api.ts`: that module targets the gateway itself (`NEXT_PUBLIC_API_URL`),
// and the whole point of this call is to work when the gateway does not answer.
// It hits this app's own route handler at `/gateway-health` instead.

export type GatewayStatus = "online" | "offline";

export interface GatewayHealth {
  status: GatewayStatus;
  checkedAt: string;
  httpStatus: number | null;
}

const PROBE_PATH = "/gateway-health";

/** Same budget the server handler gives the gateway, plus a little slack. */
const CLIENT_TIMEOUT_MS = 5000;

function offline(): GatewayHealth {
  return {
    status: "offline",
    checkedAt: new Date().toISOString(),
    httpStatus: null,
  };
}

function isGatewayStatus(value: unknown): value is GatewayStatus {
  return value === "online" || value === "offline";
}

/**
 * `AbortSignal.timeout` is widely supported but not universal. Calling it where
 * it is missing would throw *before* `fetch`, and the catch below would report a
 * healthy gateway as offline on that browser. Going without the client-side
 * timeout is the lesser failure: the handler still caps its own probe at 3s.
 */
function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(CLIENT_TIMEOUT_MS)
    : undefined;
}

/**
 * Never rejects. A probe that fails is itself evidence the app cannot reach its
 * own server, which the UI should report exactly like an unreachable gateway —
 * a thrown error would instead land the caller in a generic error state.
 */
export async function fetchGatewayHealth(
  signal?: AbortSignal,
): Promise<GatewayHealth> {
  try {
    const response = await fetch(PROBE_PATH, {
      cache: "no-store",
      signal: signal ?? timeoutSignal(),
    });
    if (!response.ok) return offline();

    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return offline();

    const { status, checkedAt, httpStatus } = body as Record<string, unknown>;
    if (!isGatewayStatus(status)) return offline();

    return {
      status,
      checkedAt: typeof checkedAt === "string" ? checkedAt : new Date().toISOString(),
      httpStatus: typeof httpStatus === "number" ? httpStatus : null,
    };
  } catch {
    return offline();
  }
}
