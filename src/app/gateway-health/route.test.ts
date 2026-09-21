/**
 * @jest-environment node
 *
 * `next/server` builds on the Fetch API's `Request`/`Response`, which jsdom does
 * not provide — and this handler only ever runs on the server anyway.
 */
import { GET } from "./route";

/**
 * The handler is the only place that knows where the gateway lives, and it has
 * to stay pointed at `/health` — the gateway excludes its health endpoints from
 * the `api` global prefix, so `/api/health` does not exist.
 */
describe("GET /gateway-health", () => {
  const fetchMock = jest.fn();
  const originalProxyTarget = process.env.API_PROXY_TARGET;
  const originalPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    delete process.env.API_PROXY_TARGET;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterAll(() => {
    process.env.API_PROXY_TARGET = originalProxyTarget;
    process.env.NEXT_PUBLIC_API_URL = originalPublicApiUrl;
  });

  it("probes the proxy target's /health and reports online on 200", async () => {
    process.env.API_PROXY_TARGET = "https://gateway.example.com";
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const body = await (await GET()).json();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.example.com/health",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(body).toMatchObject({ status: "online", httpStatus: 200 });
  });

  // The gateway answers 503 when a dependency it needs is down. The console
  // cannot do useful work against it, so that counts as offline.
  it("reports offline when the gateway answers non-OK", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const body = await (await GET()).json();

    expect(body).toMatchObject({ status: "offline", httpStatus: 503 });
  });

  it("reports offline without a status code when the gateway never answers", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const body = await (await GET()).json();

    expect(body).toMatchObject({ status: "offline", httpStatus: null });
  });

  // Direct mode sets no proxy target: the origin has to come off the absolute
  // public API URL, minus its `/api` path.
  it("falls back to the origin of an absolute NEXT_PUBLIC_API_URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://gateway.example.com/api";
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await GET();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.example.com/health",
      expect.anything(),
    );
  });

  // Proxy mode leaves NEXT_PUBLIC_API_URL as the relative "/api", which is not
  // an origin — the local default has to win instead of producing "/api/health".
  it("ignores a relative NEXT_PUBLIC_API_URL and uses the local default", async () => {
    process.env.NEXT_PUBLIC_API_URL = "/api";
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await GET();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/health",
      expect.anything(),
    );
  });
});
