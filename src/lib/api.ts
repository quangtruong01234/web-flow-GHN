// Single place that calls `fetch`. All backend access goes through the TryBuy
// Gateway only (see .ai/context/data-fetching.md). The frontend never calls GHN
// directly; carrier secrets stay backend-only.
//
// Default base is the same-origin `/api` path, which the Next dev proxy
// (next.config.mjs `rewrites`) forwards to the gateway — keeping the session
// cookie first-party. Set NEXT_PUBLIC_API_URL to an absolute gateway URL to
// bypass the proxy and call the gateway directly (requires gateway CORS).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api";

/** Typed error thrown for any non-OK response (and network failures with status 0). */
export class ApiError extends Error {
  readonly status: number;
  /** Backend exception name / `error` field, when present. */
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  query?: Record<string, QueryValue>;
}

interface BackendErrorBody {
  message?: unknown;
  error?: unknown;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Issue a request against the gateway and unwrap the global `{ data: T }`
 * success envelope. Non-OK responses throw a typed {@link ApiError}; the caller
 * (auth layer / react-query hooks) decides how to react to 401/403.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal, query } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Network request failed";
    throw new ApiError(message, 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const errBody = (payload ?? {}) as BackendErrorBody;
    const message =
      typeof errBody.message === "string" && errBody.message
        ? errBody.message
        : `Request failed with status ${response.status}`;
    const code = typeof errBody.error === "string" ? errBody.error : null;
    throw new ApiError(message, response.status, code);
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
