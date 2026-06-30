import { render, screen } from "@testing-library/react";
import type { ShipmentListItem, ShipmentListView } from "../api/types";
import { useShipmentList } from "../hooks/useShipments";
import { ShipmentTable } from "./ShipmentTable";

jest.mock("../hooks/useShipments", () => ({
  useShipmentList: jest.fn(),
}));

const shipmentItem: ShipmentListItem = {
  orderId: 101,
  ghnOrderCode: "GHN101",
  buyerName: "Buyer One",
  sellerName: "Seller One",
  localStatus: "shipping",
  ghnStatus: "delivering",
  rawGhnStatus: "delivering",
  codAmount: 250000,
  shippingFee: 30000,
  paymentMethod: "cod",
  lastSyncedAt: "2026-06-27T09:30:00.000Z",
  updatedAt: "2026-06-27T09:45:00.000Z",
  canSync: true,
  availableActions: ["read", "history", "sync"],
};

const listFixture: ShipmentListView = {
  items: [shipmentItem],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
};

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
