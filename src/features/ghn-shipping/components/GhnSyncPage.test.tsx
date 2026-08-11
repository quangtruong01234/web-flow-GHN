import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import type { ShipmentSyncView } from "../api/types";
import {
  authUser,
  ORDER_PUBLIC_ID,
  shipmentListView,
  shipmentSyncView,
} from "../testing/fixtures";
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

const listFixture = shipmentListView();

describe("GhnSyncPage", () => {
  const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
  const useToastMock = useToast as jest.MockedFunction<typeof useToast>;
  const useShipmentListMock = useShipmentList as jest.MockedFunction<typeof useShipmentList>;
  const useSyncShipmentMock = useSyncShipment as jest.MockedFunction<typeof useSyncShipment>;
  const pushMock = jest.fn();
  const mutateMock = jest.fn<void, [string, ShipmentSyncOptions?]>();

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
      user: authUser("logistics_operator"),
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<GhnSyncPage />);

    expect(screen.getByText(`#${ORDER_PUBLIC_ID}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync" })).toBeDisabled();
    expect(screen.getByText(/syncing requires the shipping manager role/i)).toBeInTheDocument();
  });

  it("lets shipping managers sync an eligible shipment", async () => {
    useAuthMock.mockReturnValue({
      user: authUser("shipping_manager"),
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    mutateMock.mockImplementation((_orderId, options) => {
      options?.onSuccess?.(shipmentSyncView());
    });

    render(<GhnSyncPage />);

    await userEvent.click(screen.getByRole("button", { name: "Sync" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(ORDER_PUBLIC_ID, expect.any(Object));
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "success",
          title: `Order #${ORDER_PUBLIC_ID} synced`,
        }),
      );
    });
  });

  it("shows retryable copy for transient GHN sync failures", async () => {
    useAuthMock.mockReturnValue({
      user: authUser("shipping_manager"),
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
          title: `GHN temporarily unavailable for #${ORDER_PUBLIC_ID}`,
          message: expect.stringContaining("Try syncing again"),
        }),
      );
    });
  });
});
