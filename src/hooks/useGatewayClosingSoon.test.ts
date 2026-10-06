import { act, renderHook } from "@testing-library/react";
import { useGatewayClosingSoon } from "./useGatewayClosingSoon";

describe("useGatewayClosingSoon", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("enters the warning window on its own clock, without a request", () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.setSystemTime(new Date("2026-10-06T18:44:50+07:00"));

    const { result } = renderHook(() => useGatewayClosingSoon());
    expect(result.current).toBeNull();

    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(result.current).toBe(15);

    act(() => {
      jest.advanceTimersByTime(15 * 60_000);
    });
    expect(result.current).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    global.fetch = originalFetch;
  });

  it("reads the clock on mount", () => {
    jest.setSystemTime(new Date("2026-10-06T18:55:00+07:00"));

    const { result } = renderHook(() => useGatewayClosingSoon());

    expect(result.current).toBe(5);
  });
});
