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

  return {
    title: "Sync failed",
    message: error.message,
  };
}

/**
 * Cancel/return failures. A 500 carries the GHN rejection message and means
 * the local order was left unchanged (the failed attempt is still recorded in
 * the shipping history).
 */
export function actionErrorCopy(error: unknown, actionLabel: string): ErrorCopy {
  const message = messageOf(
    error,
    "The action request failed. Try again in a moment.",
  );
  if (isApiError(error) && error.status === 500) {
    return {
      title: "GHN rejected the action",
      message: `${message} The local order was not changed; the failed attempt is recorded in history.`,
    };
  }
  return { title: `${actionLabel} failed`, message };
}

/**
 * COD/receiver edit failures. Same 500 semantics as actions: GHN rejected the
 * edit and the order was not changed.
 */
export function editErrorCopy(error: unknown, what: string): ErrorCopy {
  const message = messageOf(error, "The request failed. Try again in a moment.");
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
