import { isApiError } from "@/lib/api";

// Operator-facing copy for every shipment mutation failure (sync, cancel/return
// actions, COD/receiver edits, demo status). Components must not interpret
// gateway status codes themselves — add or adjust copy here instead.

export interface ErrorCopy {
  title: string;
  message: string;
}

function messageOf(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback;
}

/**
 * RESIL-01 (backend 2026-08-10): a GHN refusal or outage now surfaces as
 * `"GHN <action> error: <GHN's own message>"` with status 400 (refused, not
 * retryable) or 503 (unreachable, retry later). Branch on `statusCode`; this
 * prefix test only picks the right *title* — a 400 can also be local validation
 * ("order has no ghnOrderCode"), which is equally non-retryable. The message is
 * surfaced verbatim either way, never replaced with generic copy.
 */
function isGhnRefusal(error: unknown): boolean {
  return isApiError(error) && /^GHN\b.*\berror:/i.test(error.message);
}

const NOT_RETRYABLE_HINT =
  "Retrying the same request will not help — fix the order or pick a different action.";
const OUTAGE_HINT =
  "GHN is not answering right now. The order was not changed; retry in a moment.";

/**
 * Sync failures. The gateway distinguishes stale/unresolvable GHN waybills
 * (404, not retryable) from transient GHN outages (503, retryable), so callers
 * should not collapse both into a generic request failure.
 */
export function syncErrorCopy(error: unknown): ErrorCopy {
  if (!isApiError(error)) {
    return {
      title: "Sync failed",
      message: "The sync request failed. Try again in a moment.",
    };
  }

  if (error.status === 404) {
    return {
      title: "GHN waybill not found",
      message: `${error.message} This is not retryable until the GHN code is corrected or GHN can resolve the waybill again.`,
    };
  }

  if (error.status === 503) {
    return {
      title: "GHN temporarily unavailable",
      message: `${error.message} Try syncing again after GHN is reachable.`,
    };
  }

  if (error.status === 400) {
    return {
      title: isGhnRefusal(error) ? "GHN refused the sync" : "Sync failed",
      message: `${error.message} ${NOT_RETRYABLE_HINT}`,
    };
  }

  return {
    title: "Sync failed",
    message: error.message,
  };
}

/**
 * Cancel/return failures. Either way the local order was left unchanged and the
 * failed attempt is recorded in the shipping history:
 * - `400` — GHN (or a local guard) refused the action. Not retryable.
 * - `503` — GHN is unreachable or the circuit breaker is open. Retry later.
 * - `500` — the pre-RESIL-01 shape; keep it until the backend deploy lands.
 */
export function actionErrorCopy(error: unknown, actionLabel: string): ErrorCopy {
  const message = messageOf(
    error,
    "The action request failed. Try again in a moment.",
  );
  if (isApiError(error) && error.status === 503) {
    return {
      title: "GHN temporarily unavailable",
      message: `${message} ${OUTAGE_HINT}`,
    };
  }
  if (isApiError(error) && error.status === 400 && isGhnRefusal(error)) {
    return {
      title: "GHN rejected the action",
      message: `${message} The local order was not changed. ${NOT_RETRYABLE_HINT}`,
    };
  }
  if (isApiError(error) && error.status === 500) {
    return {
      title: "GHN rejected the action",
      message: `${message} The local order was not changed; the failed attempt is recorded in history.`,
    };
  }
  return { title: `${actionLabel} failed`, message };
}

/**
 * COD/receiver edit failures. Same 400/503/500 semantics as actions: GHN
 * refused or was unreachable, and the order was not changed.
 */
export function editErrorCopy(error: unknown, what: string): ErrorCopy {
  const message = messageOf(error, "The request failed. Try again in a moment.");
  if (isApiError(error) && error.status === 503) {
    return {
      title: "GHN temporarily unavailable",
      message: `${message} ${OUTAGE_HINT}`,
    };
  }
  if (isApiError(error) && error.status === 400 && isGhnRefusal(error)) {
    return {
      title: "GHN rejected the edit",
      message: `${message} The order was not changed. ${NOT_RETRYABLE_HINT}`,
    };
  }
  if (isApiError(error) && error.status === 500) {
    return {
      title: "GHN rejected the edit",
      message: `${message} The order was not changed; the failed attempt is recorded in history.`,
    };
  }
  return { title: `${what} update failed`, message };
}

/**
 * Demo-status failures. A 403 with a "disabled" body means the environment has
 * the demo endpoint switched off — surface it as information, never as an
 * authorization failure.
 */
export function demoErrorCopy(
  error: unknown,
): ErrorCopy & { kind: "info" | "error" } {
  if (
    isApiError(error) &&
    error.status === 403 &&
    /disabled/i.test(error.message)
  ) {
    return {
      kind: "info",
      title: "Demo mode not enabled",
      message:
        "The demo-status endpoint is disabled in this environment. Set GHN_DEMO_ENDPOINTS_ENABLED=true on the backend and restart it.",
    };
  }
  return {
    kind: "error",
    title: "Demo status failed",
    message: messageOf(error, "The demo request failed. Try again in a moment."),
  };
}
