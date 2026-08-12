import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { ORDER_PUBLIC_ID, shipmentListView } from "../testing/fixtures";
import { useShipmentList } from "../hooks/useShipments";
import { ShipmentTable } from "./ShipmentTable";

jest.mock("../hooks/useShipments", () => ({
  useShipmentList: jest.fn(),
}));

const listFixture = shipmentListView({ limit: 20 });

describe("ShipmentTable", () => {
  const useShipmentListMock = useShipmentList as jest.MockedFunction<typeof useShipmentList>;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it("sends only the selected filter value", async () => {
    render(<ShipmentTable />);

    await userEvent.selectOptions(
      screen.getByLabelText("GHN status"),
      "delivery_fail",
    );

    await waitFor(() => {
      expect(useShipmentListMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ ghnStatus: "delivery_fail", status: undefined }),
      );
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
});
