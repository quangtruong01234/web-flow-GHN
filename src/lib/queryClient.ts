import { MutationCache, QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    // Diagnostics for genuinely unexpected mutation failures only: network
    // faults and 5xx. 4xx are expected business errors the UI already explains.
    // Never log mutation variables — request bodies can carry receiver PII.
    mutationCache: new MutationCache({
      onError: (error) => {
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
      queries: { staleTime: 1000 * 60, retry: 1, refetchOnWindowFocus: false },
    },
  });
}
