import {
  BACKEND_ORDER_STATUS_VALUES,
  GHN_STATUS_FILTER_VALUES,
  type BackendOrderStatus,
  type GhnStatusFilter,
  type ShipmentListParams,
} from "../api/types";

/**
 * The `/shipments` filter state, kept in the URL so Back from a detail page and
 * a shared link both reopen the same view.
 *
 * URL keys reuse the gateway's param names. A cleared or default value is
 * omitted from the URL and from the gateway query alike: `?status=` and
 * `?ghnStatus=` are 400s since GHN-ENUM-01.
 */
export interface ShipmentListFilters {
  search: string;
  status: BackendOrderStatus | null;
  ghnStatus: GhnStatusFilter | null;
  hasGhnCode: boolean;
  dateFrom: string;
  dateTo: string;
  page: number;
}

export const DEFAULT_SHIPMENT_LIST_FILTERS: ShipmentListFilters = {
  search: "",
  status: null,
  ghnStatus: null,
  hasGhnCode: false,
  dateFrom: "",
  dateTo: "",
  page: 1,
};

/** The read side of `URLSearchParams` — also what `useSearchParams()` returns. */
interface SearchParamsReader {
  get(name: string): string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pickEnum<T extends string>(
  values: ReadonlyArray<T>,
  raw: string | null,
): T | null {
  return values.find((value) => value === raw) ?? null;
}

/**
 * Read the filters from the URL. Anything a hand-edited link gets wrong — an
 * unknown status, a malformed date, page `0` — falls back to the default
 * instead of reaching the gateway as a request that can only answer 400.
 */
export function parseShipmentListSearch(
  searchParams: SearchParamsReader,
): ShipmentListFilters {
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Number(searchParams.get("page"));

  return {
    search: (searchParams.get("search") ?? "").trim(),
    status: pickEnum(BACKEND_ORDER_STATUS_VALUES, searchParams.get("status")),
    ghnStatus: pickEnum(GHN_STATUS_FILTER_VALUES, searchParams.get("ghnStatus")),
    hasGhnCode: searchParams.get("hasGhnCode") === "true",
    dateFrom: ISO_DATE.test(dateFrom) ? dateFrom : "",
    dateTo: ISO_DATE.test(dateTo) ? dateTo : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Serialise the filters to a query string (no leading `?`), omitting defaults. */
export function buildShipmentListSearch(filters: ShipmentListFilters): string {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.ghnStatus) query.set("ghnStatus", filters.ghnStatus);
  if (filters.hasGhnCode) query.set("hasGhnCode", "true");
  if (filters.dateFrom) query.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) query.set("dateTo", filters.dateTo);
  if (filters.page > 1) query.set("page", String(filters.page));
  return query.toString();
}

/** The `/shipments` href for a filter set — what quick-filter links point at. */
export function shipmentListHref(filters: Partial<ShipmentListFilters>): string {
  const query = buildShipmentListSearch({ ...DEFAULT_SHIPMENT_LIST_FILTERS, ...filters });
  return query ? `/shipments?${query}` : "/shipments";
}

/** Gateway params for a filter set; `undefined` keys are dropped by the query builder. */
export function toShipmentListParams(
  filters: ShipmentListFilters,
  limit: number,
): ShipmentListParams {
  return {
    page: filters.page,
    limit,
    search: filters.search || undefined,
    status: filters.status ?? undefined,
    ghnStatus: filters.ghnStatus ?? undefined,
    hasGhnCode: filters.hasGhnCode ? true : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}
