import {
  DEFAULT_SHIPMENT_LIST_FILTERS,
  buildShipmentListSearch,
  parseShipmentListSearch,
  shipmentListHref,
  toShipmentListParams,
} from "./shipment-list-query";

const parse = (query: string) => parseShipmentListSearch(new URLSearchParams(query));

describe("parseShipmentListSearch", () => {
  it("reads every filter the list supports", () => {
    expect(
      parse(
        "search=%20GHN101%20&status=delivering&ghnStatus=exception&hasGhnCode=true" +
          "&dateFrom=2026-09-01&dateTo=2026-09-30&page=3",
      ),
    ).toEqual({
      search: "GHN101",
      status: "delivering",
      ghnStatus: "exception",
      hasGhnCode: true,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      page: 3,
    });
  });

  it("returns the defaults for an empty query", () => {
    expect(parse("")).toEqual(DEFAULT_SHIPMENT_LIST_FILTERS);
  });

  // A hand-edited link must not turn into a request that can only answer 400
  // (GHN-ENUM-01) — an unknown value falls back to "no filter".
  it("drops values the gateway would reject", () => {
    expect(
      parse(
        "status=shipping&ghnStatus=bogus&hasGhnCode=1&dateFrom=01/09/2026" +
          "&dateTo=2026-9-1&page=0",
      ),
    ).toEqual(DEFAULT_SHIPMENT_LIST_FILTERS);
    expect(parse("page=-2").page).toBe(1);
    expect(parse("page=2.5").page).toBe(1);
    expect(parse("page=abc").page).toBe(1);
  });

  it("treats empty enum values as cleared", () => {
    const filters = parse("status=&ghnStatus=");
    expect(filters.status).toBeNull();
    expect(filters.ghnStatus).toBeNull();
  });
});

describe("buildShipmentListSearch", () => {
  it("omits every default", () => {
    expect(buildShipmentListSearch(DEFAULT_SHIPMENT_LIST_FILTERS)).toBe("");
  });

  it("round-trips through the parser", () => {
    const filters = {
      search: "Lê Văn A",
      status: "completed" as const,
      ghnStatus: "delivery_fail" as const,
      hasGhnCode: true,
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      page: 2,
    };
    expect(parse(buildShipmentListSearch(filters))).toEqual(filters);
  });
});

describe("shipmentListHref", () => {
  it("links to a single filter", () => {
    expect(shipmentListHref({ ghnStatus: "lost" })).toBe("/shipments?ghnStatus=lost");
  });

  it("links to the bare list when nothing is set", () => {
    expect(shipmentListHref({})).toBe("/shipments");
  });
});

describe("toShipmentListParams", () => {
  it("sends only the filters that are set", () => {
    expect(toShipmentListParams(DEFAULT_SHIPMENT_LIST_FILTERS, 20)).toEqual({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      ghnStatus: undefined,
      hasGhnCode: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  });

  it("carries the set filters through", () => {
    expect(
      toShipmentListParams(
        { ...DEFAULT_SHIPMENT_LIST_FILTERS, ghnStatus: "damage", hasGhnCode: true, page: 4 },
        20,
      ),
    ).toEqual(
      expect.objectContaining({ page: 4, ghnStatus: "damage", hasGhnCode: true }),
    );
  });
});
