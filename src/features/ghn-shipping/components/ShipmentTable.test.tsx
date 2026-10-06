import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { ORDER_PUBLIC_ID, shipmentListItem, shipmentListView } from "../testing/fixtures";
import { useShipmentList } from "../hooks/useShipments";
import { ShipmentTable } from "./ShipmentTable";

jest.mock("../hooks/useShipments", () => ({
  useShipmentList: jest.fn(),
}));

const replaceMock = jest.fn();
let currentQuery = "";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  usePathname: () => "/shipments",
  useSearchParams: () => new URLSearchParams(currentQuery),
}));

const listFixture = shipmentListView({ limit: 20 });

describe("ShipmentTable", () => {
  const useShipmentListMock = useShipmentList as jest.MockedFunction<typeof useShipmentList>;

  beforeEach(() => {
    jest.clearAllMocks();
    currentQuery = "";
    useShipmentListMock.mockReturnValue({
      data: listFixture,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);
  });

  it("renders shipment rows from the gateway list view", () => {
    render(<ShipmentTable />);

    expect(useShipmentListMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(screen.getByRole("link", { name: `#${ORDER_PUBLIC_ID}` })).toHaveAttribute(
      "href",
      `/shipments/${ORDER_PUBLIC_ID}`,
    );
    expect(screen.getByText("Buyer One")).toBeInTheDocument();
    expect(screen.getByText("Seller One")).toBeInTheDocument();
    expect(screen.getByText("GHN101")).toBeInTheDocument();
  });

  // GHN-ENUM-01: `?status=` and `?ghnStatus=` are now 400s, so a cleared filter
  // must be omitted from the query entirely rather than sent empty.
  it("omits cleared filters instead of sending empty values", () => {
    render(<ShipmentTable />);

    const params = useShipmentListMock.mock.calls[0][0];
    expect(params.status).toBeUndefined();
    expect(params.ghnStatus).toBeUndefined();
    expect(params.search).toBeUndefined();
    expect(params.dateFrom).toBeUndefined();
    expect(params.dateTo).toBeUndefined();
    expect(params.hasGhnCode).toBeUndefined();
  });

  // The URL is the filter state, so Back from a detail page and a shared link
  // both reopen the same view.
  it("restores the filters from the URL", () => {
    currentQuery = "ghnStatus=exception&status=delivering&search=GHN101&page=2";

    render(<ShipmentTable />);

    expect(useShipmentListMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 2,
        ghnStatus: "exception",
        status: "delivering",
        search: "GHN101",
      }),
    );
    expect(screen.getByLabelText("GHN status")).toHaveValue("exception");
    expect(screen.getByLabelText("Local status")).toHaveValue("delivering");
    expect(screen.getByLabelText("Search order ID, GHN code, or address")).toHaveValue(
      "GHN101",
    );
  });

  it("offers the needs-attention quick filters and explains the active one", () => {
    render(<ShipmentTable />);

    expect(screen.getByRole("link", { name: /delivery failed/i })).toHaveAttribute(
      "href",
      "/shipments?ghnStatus=delivery_fail",
    );
    expect(screen.queryByText(/ever recorded this GHN status/i)).not.toBeInTheDocument();
  });

  it("marks the applied quick filter and notes the ever-recorded match", () => {
    currentQuery = "ghnStatus=lost";

    render(<ShipmentTable />);

    expect(screen.getByRole("link", { name: /lost/i })).toHaveAttribute("aria-current", "true");
    expect(screen.getByText(/ever recorded this GHN status/i)).toBeInTheDocument();
  });

  it("never sends an unknown value from a hand-edited URL", () => {
    currentQuery = "ghnStatus=bogus&status=";

    render(<ShipmentTable />);

    const params = useShipmentListMock.mock.calls[0][0];
    expect(params.ghnStatus).toBeUndefined();
    expect(params.status).toBeUndefined();
  });

  it("writes the selected filter to the URL and resets the page", async () => {
    currentQuery = "page=3";
    render(<ShipmentTable />);

    await userEvent.selectOptions(screen.getByLabelText("GHN status"), "delivery_fail");

    expect(replaceMock).toHaveBeenLastCalledWith("/shipments?ghnStatus=delivery_fail", {
      scroll: false,
    });
  });

  it("drops a cleared filter from the URL", async () => {
    currentQuery = "ghnStatus=delivery_fail&hasGhnCode=true";
    render(<ShipmentTable />);

    await userEvent.selectOptions(screen.getByLabelText("GHN status"), "all");

    expect(replaceMock).toHaveBeenLastCalledWith("/shipments?hasGhnCode=true", {
      scroll: false,
    });
  });

  it("writes the debounced search to the URL", async () => {
    render(<ShipmentTable />);

    await userEvent.type(
      screen.getByLabelText("Search order ID, GHN code, or address"),
      "GHN101",
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/shipments?search=GHN101", {
        scroll: false,
      });
    });
    expect(replaceMock).toHaveBeenCalledTimes(1);
  });

  it("pages through the URL", async () => {
    useShipmentListMock.mockReturnValue({
      data: { ...listFixture, hasNext: true },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);
    currentQuery = "ghnStatus=lost";
    render(<ShipmentTable />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(replaceMock).toHaveBeenLastCalledWith("/shipments?ghnStatus=lost&page=2", {
      scroll: false,
    });
  });

  // A rejected filter names the accepted set — show that, and drop the Retry
  // button, because the same request can never succeed.
  it("surfaces a 400 filter rejection verbatim without a retry", () => {
    useShipmentListMock.mockReturnValue({
      data: undefined,
      error: new ApiError(
        "ghnStatus must be one of the following values: ready_to_pick, picking",
        400,
      ),
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);

    render(<ShipmentTable />);

    expect(screen.getByText("Filter rejected by the server")).toBeInTheDocument();
    expect(
      screen.getByText(/ghnStatus must be one of the following values/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("keeps the retryable copy for a non-filter failure", () => {
    useShipmentListMock.mockReturnValue({
      data: undefined,
      error: new ApiError("Gateway timeout", 503),
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);

    render(<ShipmentTable />);

    expect(screen.getByText("Could not load shipments")).toBeInTheDocument();
    expect(screen.queryByText("Filter rejected by the server")).not.toBeInTheDocument();
  });

  // The hint is measured against the fetch time, never a live clock, and it is
  // only a hint: nothing on the row syncs.
  it("marks a moving order with no GHN update in 24h", () => {
    useShipmentListMock.mockReturnValue({
      data: shipmentListView({
        items: [
          shipmentListItem({ orderId: "ord_stale", lastSyncedAt: "2026-10-04T08:00:00Z" }),
          shipmentListItem({ orderId: "ord_fresh", lastSyncedAt: "2026-10-06T07:00:00Z" }),
          shipmentListItem({
            orderId: "ord_done",
            ghnStatus: "delivered",
            rawGhnStatus: "delivered",
            lastSyncedAt: "2026-09-01T08:00:00Z",
          }),
        ],
      }),
      dataUpdatedAt: Date.parse("2026-10-06T08:00:00Z"),
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);

    render(<ShipmentTable />);

    const hints = screen.getAllByText("No GHN update in 24h+");
    expect(hints).toHaveLength(1);
    expect(hints[0].closest("tr")).toHaveTextContent("#ord_stale");
    expect(screen.queryByRole("button", { name: /sync/i })).not.toBeInTheDocument();
  });
});
