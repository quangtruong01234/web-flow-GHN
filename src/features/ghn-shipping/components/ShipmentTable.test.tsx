import { render, screen } from "@testing-library/react";
import { shipmentListView } from "../testing/fixtures";
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
    expect(screen.getByRole("link", { name: "#101" })).toHaveAttribute(
      "href",
      "/shipments/101",
    );
    expect(screen.getByText("Buyer One")).toBeInTheDocument();
    expect(screen.getByText("Seller One")).toBeInTheDocument();
    expect(screen.getByText("GHN101")).toBeInTheDocument();
  });
});
