import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, isApiError } from "@/lib/api";
import { notifySessionExpired } from "@/lib/session-expiry";

/**
 * A `401` means the HttpOnly session cookie expired or was revoked. Report it so
 * `AuthProvider` can drop `user` and `AuthGate` can send the operator to
 * `/login?next=<path>`; otherwise every screen sits on a generic error state
 * behind a Retry button that can only 401 again.
 */
function reportIfSessionExpired(error: unknown): void {
  if (isApiError(error) && error.status === 401) notifySessionExpired();
}

/** 4xx are the backend's verdict on this exact request — repeating it changes nothing. */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: reportIfSessionExpired }),
    // Diagnostics for genuinely unexpected mutation failures only: network
    // faults and 5xx. 4xx are expected business errors the UI already explains.
    // Never log mutation variables — request bodies can carry receiver PII.
    mutationCache: new MutationCache({
      onError: (error) => {
        reportIfSessionExpired(error);
        if (!isApiError(error)) {
          console.error("[ghn-console] mutation failed unexpectedly:", error);
          return;
        }
        if (error.status >= 500) {
          console.error(
            `[ghn-console] mutation failed (${error.status}):`,
            error.message,
          );
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}
