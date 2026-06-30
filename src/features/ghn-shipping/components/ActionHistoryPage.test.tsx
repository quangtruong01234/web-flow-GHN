import { render, screen } from "@testing-library/react";
import type { ShipmentListItem, ShipmentListView } from "../api/types";
import { useShipmentList } from "../hooks/useShipments";
import { ActionHistoryPage } from "./ActionHistoryPage";

jest.mock("../hooks/useShipments", () => ({
  useShipmentList: jest.fn(),
}));

const shipmentItem: ShipmentListItem = {
  orderId: 101,
  ghnOrderCode: "GHN101",
  buyerName: "Buyer One",
  sellerName: "Seller One",
  localStatus: "shipping",
  ghnStatus: "returned",
  rawGhnStatus: "returned",
  codAmount: 250000,
  shippingFee: 30000,
  paymentMethod: "cod",
  lastSyncedAt: "2026-06-27T09:30:00.000Z",
  updatedAt: "2026-06-27T09:45:00.000Z",
  canSync: false,
  availableActions: ["read", "history"],
};

const listFixture: ShipmentListView = {
  items: [shipmentItem],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNext: false,
};

describe("ActionHistoryPage", () => {
  const useShipmentListMock = useShipmentList as jest.MockedFunction<typeof useShipmentList>;

  beforeEach(() => {
    jest.clearAllMocks();
    useShipmentListMock.mockReturnValue({
      data: listFixture,
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);
  });

  it("renders recent shipment activity with timeline links", () => {
    render(<ActionHistoryPage />);

    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText("GHN101")).toBeInTheDocument();
    expect(screen.getByText("Returned")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute(
      "href",
      "/shipments/101",
    );
  });
});
