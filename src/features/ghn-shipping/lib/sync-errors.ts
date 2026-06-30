import { isApiError } from "@/lib/api";

interface SyncErrorCopy {
  title: string;
  message: string;
}

/**
 * Operator-facing copy for backend sync failures. The gateway now distinguishes
 * stale/unresolvable GHN waybills from transient GHN outages, so callers should
 * not collapse both into a generic request failure.
 */
export function syncErrorCopy(error: unknown): SyncErrorCopy {
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
