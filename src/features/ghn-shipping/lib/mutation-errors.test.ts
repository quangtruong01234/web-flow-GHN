import { ApiError } from "@/lib/api";
import {
  actionErrorCopy,
  demoErrorCopy,
  editErrorCopy,
  syncErrorCopy,
} from "./mutation-errors";

describe("syncErrorCopy", () => {
  it("marks a 404 waybill as not retryable", () => {
    const copy = syncErrorCopy(new ApiError("GHN order X not found", 404));
    expect(copy.title).toBe("GHN waybill not found");
    expect(copy.message).toContain("not retryable");
  });

  it("marks a 503 outage as retryable", () => {
    const copy = syncErrorCopy(new ApiError("GHN detail request failed", 503));
    expect(copy.title).toBe("GHN temporarily unavailable");
    expect(copy.message).toContain("Try syncing again");
  });

  it("falls back to a generic failure for non-API errors", () => {
    const copy = syncErrorCopy(new Error("boom"));
    expect(copy.title).toBe("Sync failed");
    expect(copy.message).toContain("Try again in a moment");
  });
});

describe("actionErrorCopy", () => {
  it("surfaces a 500 as a GHN rejection with order-unchanged note", () => {
    const copy = actionErrorCopy(
      new ApiError("GHN return error: invalid state", 500),
      "Return to shop",
    );
    expect(copy.title).toBe("GHN rejected the action");
    expect(copy.message).toContain("GHN return error: invalid state");
    expect(copy.message).toContain("was not changed");
  });

  it("uses the action label for non-500 failures", () => {
    const copy = actionErrorCopy(
      new ApiError('Action "cancel" is not allowed', 400),
      "Cancel waybill",
    );
    expect(copy.title).toBe("Cancel waybill failed");
    expect(copy.message).toBe('Action "cancel" is not allowed');
  });
});

describe("editErrorCopy", () => {
  it("surfaces a 500 as a GHN-rejected edit", () => {
    const copy = editErrorCopy(new ApiError("GHN updateCOD error: x", 500), "COD");
    expect(copy.title).toBe("GHN rejected the edit");
    expect(copy.message).toContain("was not changed");
  });

  it("uses the field name for validation failures", () => {
    const copy = editErrorCopy(
      new ApiError("codAmount must not be less than 0", 400),
      "COD",
    );
    expect(copy.title).toBe("COD update failed");
    expect(copy.message).toBe("codAmount must not be less than 0");
  });
});

describe("demoErrorCopy", () => {
  it("treats a 403 disabled body as info, not an authz failure", () => {
    const copy = demoErrorCopy(
      new ApiError("GHN demo status endpoint is disabled", 403),
    );
    expect(copy.kind).toBe("info");
    expect(copy.title).toBe("Demo mode not enabled");
    expect(copy.message).toContain("GHN_DEMO_ENDPOINTS_ENABLED");
  });

  it("keeps a plain 403 as an error", () => {
    const copy = demoErrorCopy(new ApiError("Forbidden", 403));
    expect(copy.kind).toBe("error");
    expect(copy.title).toBe("Demo status failed");
    expect(copy.message).toBe("Forbidden");
  });

  it("falls back for non-API errors", () => {
    const copy = demoErrorCopy(new Error("network down"));
    expect(copy.kind).toBe("error");
    expect(copy.message).toContain("Try again in a moment");
  });
});
