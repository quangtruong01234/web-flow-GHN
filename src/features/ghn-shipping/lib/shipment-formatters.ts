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
