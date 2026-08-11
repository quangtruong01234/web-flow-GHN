const ORDER_PUBLIC_ID_PATTERN = /^ord_[A-Za-z0-9]{16}$/;

export function isOrderPublicId(value: string): boolean {
  return ORDER_PUBLIC_ID_PATTERN.test(value);
}
