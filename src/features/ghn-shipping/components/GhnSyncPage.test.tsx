import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import type { ShipmentListItem, ShipmentListView, ShipmentSyncView } from "../api/types";
import { useShipmentList, useSyncShipment } from "../hooks/useShipments";
import { GhnSyncPage } from "./GhnSyncPage";

jest.mock("@/context/AuthContext", () => ({
  canSync: (role: string | undefined) => role === "shipping_manager",
  useAuth: jest.fn(),
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(),
}));

jest.mock("../hooks/useShipments", () => ({
  useShipmentList: jest.fn(),
  useSyncShipment: jest.fn(),
}));

interface ShipmentSyncOptions {
  onSuccess?: (result: ShipmentSyncView) => void;
  onError?: (error: unknown) => void;
}

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
  limit: 50,
  totalPages: 1,
  hasNext: false,
};

describe("GhnSyncPage", () => {
  const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
  const useToastMock = useToast as jest.MockedFunction<typeof useToast>;
  const useShipmentListMock = useShipmentList as jest.MockedFunction<typeof useShipmentList>;
  const useSyncShipmentMock = useSyncShipment as jest.MockedFunction<typeof useSyncShipment>;
  const pushMock = jest.fn();
  const mutateMock = jest.fn<void, [number, ShipmentSyncOptions?]>();

  beforeEach(() => {
    jest.clearAllMocks();
    useToastMock.mockReturnValue({
      toasts: [],
      push: pushMock,
      dismiss: jest.fn(),
    });
    useShipmentListMock.mockReturnValue({
      data: listFixture,
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentList>);
    useSyncShipmentMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useSyncShipment>);
  });

  it("renders syncable rows but disables sync for logistics operators", () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 1,
        username: "logistics_test",
        name: "Logistics Operator",
        email: "logistics@example.com",
        role: "logistics_operator",
        title: "Logistics Operator",
      },
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<GhnSyncPage />);

    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync" })).toBeDisabled();
    expect(screen.getByText(/syncing requires the shipping manager role/i)).toBeInTheDocument();
  });

  it("lets shipping managers sync an eligible shipment", async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 2,
        username: "shipmgr_test",
        name: "Shipping Manager",
        email: "shipmgr@example.com",
        role: "shipping_manager",
        title: "Shipping Manager",
      },
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    mutateMock.mockImplementation((_orderId, options) => {
      options?.onSuccess?.({
        orderId: 101,
        previousStatus: "shipping",
        newStatus: "shipping",
        ghnStatus: "delivering",
        syncedAt: "2026-06-27T10:00:00.000Z",
      });
    });

    render(<GhnSyncPage />);

    await userEvent.click(screen.getByRole("button", { name: "Sync" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(101, expect.any(Object));
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "success",
          title: "Order #101 synced",
        }),
      );
    });
  });

  it("shows retryable copy for transient GHN sync failures", async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 2,
        username: "shipmgr_test",
        name: "Shipping Manager",
        email: "shipmgr@example.com",
        role: "shipping_manager",
        title: "Shipping Manager",
      },
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    mutateMock.mockImplementation((_orderId, options) => {
      options?.onError?.(
        new ApiError("GHN detail request failed: timeout", 503),
      );
    });

    render(<GhnSyncPage />);

    await userEvent.click(screen.getByRole("button", { name: "Sync" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "error",
          title: "GHN temporarily unavailable for #101",
          message: expect.stringContaining("Try syncing again"),
        }),
      );
    });
  });
});
