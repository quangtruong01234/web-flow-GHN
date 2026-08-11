import { render, screen } from "@testing-library/react";
import {
  ORDER_PUBLIC_ID,
  shipmentListItem,
  shipmentListView,
} from "../testing/fixtures";
import { useShipmentList } from "../hooks/useShipments";
import { ActionHistoryPage } from "./ActionHistoryPage";

jest.mock("../hooks/useShipments", () => ({
  useShipmentList: jest.fn(),
}));

const listFixture = shipmentListView({
  items: [
    shipmentListItem({
      ghnStatus: "returned",
      rawGhnStatus: "returned",
      canSync: false,
      availableActions: ["read", "history"],
    }),
  ],
});

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

    expect(screen.getByText(`#${ORDER_PUBLIC_ID}`)).toBeInTheDocument();
    expect(screen.getByText("GHN101")).toBeInTheDocument();
    expect(screen.getByText("Returned")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute(
      "href",
      `/shipments/${ORDER_PUBLIC_ID}`,
    );
  });
});
