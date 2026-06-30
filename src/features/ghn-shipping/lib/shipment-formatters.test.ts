import {
  fmtCod,
  fmtCodNullable,
  fmtDateTime,
  fmtFee,
  fmtVND,
} from "./shipment-formatters";

describe("money formatters", () => {
  it("formats VND with a currency suffix", () => {
    expect(fmtVND(0)).toBe("0 VND");
    expect(fmtVND(250000)).toContain("VND");
    expect(fmtVND(250000)).toContain("250");
  });

  it("uses friendly placeholders for zero COD / fee", () => {
    expect(fmtCod(0)).toBe("No COD");
    expect(fmtFee(0)).toBe("-");
  });

  it("renders an em dash for null/undefined money", () => {
    expect(fmtCodNullable(null)).toBe("—");
    expect(fmtCodNullable(undefined)).toBe("—");
    expect(fmtCodNullable(0)).toBe("No COD");
  });
});

describe("fmtDateTime", () => {
  it("returns an em dash for empty or invalid input", () => {
    expect(fmtDateTime(null)).toBe("—");
    expect(fmtDateTime(undefined)).toBe("—");
    expect(fmtDateTime("not-a-date")).toBe("—");
  });

  it("formats a valid ISO timestamp into a non-empty string", () => {
    const out = fmtDateTime("2026-06-27T08:00:00.000Z");
    expect(out).not.toBe("—");
    expect(out).toMatch(/2026/);
  });
});
