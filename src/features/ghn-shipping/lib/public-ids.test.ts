import { isOrderPublicId } from "./public-ids";

describe("isOrderPublicId", () => {
  it("accepts the gateway's opaque order id format", () => {
    expect(isOrderPublicId("ord_AbCdEf1234567890")).toBe(true);
  });

  it.each(["101", "ord_short", "ORD_AbCdEf1234567890", "ord_AbCdEf123456789-"])(
    "rejects malformed route id %s",
    (value) => {
      expect(isOrderPublicId(value)).toBe(false);
    },
  );
});
