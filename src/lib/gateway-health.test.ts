import { fetchGatewayHealth } from "./gateway-health";

/**
 * Every branch here has to resolve rather than throw. The probe feeds a banner
 * that renders on every page: a rejection would surface as an unhandled query
 * error instead of the "backend is offline" message it exists to produce.
 */
describe("fetchGatewayHealth", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function jsonResponse(body: unknown, ok = true): Response {
    return {
      ok,
      json: async () => body,
    } as unknown as Response;
  }

  it("reports online when the handler says the gateway answered", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "online",
        checkedAt: "2026-09-18T11:42:00+07:00",
        httpStatus: 200,
      }),
    );

    await expect(fetchGatewayHealth()).resolves.toEqual({
      status: "online",
      checkedAt: "2026-09-18T11:42:00+07:00",
      httpStatus: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/gateway-health",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("passes the offline verdict through with the gateway's status code", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "offline",
        checkedAt: "2026-09-18T11:42:00+07:00",
        httpStatus: 503,
      }),
    );

    await expect(fetchGatewayHealth()).resolves.toMatchObject({
      status: "offline",
      httpStatus: 503,
    });
  });

  // The app's own server being unreachable is, from the browser, the same
  // situation as the gateway being unreachable — report it identically.
  it("reports offline when the probe request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchGatewayHealth()).resolves.toMatchObject({
      status: "offline",
      httpStatus: null,
    });
  });

  it("reports offline when the handler answers non-OK", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "online" }, false));

    await expect(fetchGatewayHealth()).resolves.toMatchObject({
      status: "offline",
    });
  });

  // A stray HTML error page or a proxy's JSON would otherwise be read as
  // "online" through an undefined status.
  it("reports offline when the payload is not the expected shape", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "probably fine" }));

    await expect(fetchGatewayHealth()).resolves.toMatchObject({
      status: "offline",
    });
  });
});
