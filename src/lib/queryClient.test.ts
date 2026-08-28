import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { makeQueryClient } from "@/lib/queryClient";
import { onSessionExpired } from "@/lib/session-expiry";

/** Drive one query to completion through the real client, returning its error. */
async function runQuery(
  client: QueryClient,
  key: string,
  queryFn: () => Promise<unknown>,
): Promise<void> {
  await client.fetchQuery({ queryKey: [key], queryFn }).catch(() => undefined);
}

describe("makeQueryClient", () => {
  let client: QueryClient;
  let expired: jest.Mock;
  let unsubscribe: () => void;

  beforeEach(() => {
    client = makeQueryClient();
    expired = jest.fn();
    unsubscribe = onSessionExpired(expired);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    unsubscribe();
    client.clear();
    jest.restoreAllMocks();
  });

  it("reports session expiry when a query is rejected with 401", async () => {
    await runQuery(client, "expired", () =>
      Promise.reject(new ApiError("Unauthorized", 401)),
    );

    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("reports session expiry when a mutation is rejected with 401", async () => {
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.reject(new ApiError("Unauthorized", 401)),
      })
      .execute(undefined)
      .catch(() => undefined);

    expect(expired).toHaveBeenCalledTimes(1);
  });

  // A 403 is the gateway refusing this role/action, not an expired session —
  // bouncing to /login would loop the operator straight back in.
  it("does not report session expiry for a 403", async () => {
    await runQuery(client, "forbidden", () =>
      Promise.reject(new ApiError("Forbidden", 403)),
    );

    expect(expired).not.toHaveBeenCalled();
  });

  it("does not retry a 4xx", async () => {
    const queryFn = jest
      .fn()
      .mockRejectedValue(new ApiError("Unauthorized", 401));

    await runQuery(client, "no-retry", queryFn);

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("still retries a 5xx once", async () => {
    const queryFn = jest
      .fn()
      .mockRejectedValue(new ApiError("Server is under heavy load", 503));

    await runQuery(client, "retry-5xx", queryFn);

    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
