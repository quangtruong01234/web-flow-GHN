export function fmtVND(value: number): string {
  if (value === 0) return "0 VND";
  return `${Number(value).toLocaleString("vi-VN")} VND`;
}

export function fmtCod(value: number): string {
  return value === 0 ? "No COD" : fmtVND(value);
}

export function fmtFee(value: number): string {
  return value === 0 ? "-" : fmtVND(value);
}

/** Money for fields the backend may omit (list COD/fee can be null). */
export function fmtCodNullable(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : fmtCod(value);
}

export function fmtFeeNullable(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : fmtFee(value);
}

/** Format an ISO timestamp from the backend for display. */
export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
