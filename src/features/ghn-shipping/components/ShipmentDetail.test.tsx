import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import type {
  ShipmentActionView,
  ShipmentDetailView,
  ShipmentHistoryRow,
  ShipmentManualAction,
  SetDemoStatusInput,
  ShipmentSyncView,
} from "../api/types";
import {
  useShipmentAction,
  useShipmentDetail,
  useShipmentHistory,
  useSetDemoStatus,
  useSyncShipment,
} from "../hooks/useShipments";
import { ShipmentDetail } from "./ShipmentDetail";

jest.mock("@/context/AuthContext", () => ({
  canSync: (role: string | undefined) => role === "shipping_manager",
  useAuth: jest.fn(),
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(),
}));

jest.mock("../hooks/useShipments", () => ({
  useShipmentAction: jest.fn(),
  useShipmentDetail: jest.fn(),
  useShipmentHistory: jest.fn(),
  useSetDemoStatus: jest.fn(),
  useSyncShipment: jest.fn(),
}));

interface ShipmentActionInput {
  orderId: number;
  action: ShipmentManualAction;
}

interface ShipmentActionOptions {
  onSuccess?: (result: ShipmentActionView) => void;
  onError?: (error: unknown) => void;
}

interface ShipmentSyncOptions {
  onSuccess?: (result: ShipmentSyncView) => void;
  onError?: (error: unknown) => void;
}

interface SetDemoStatusMutationInput {
  orderId: number;
  body: SetDemoStatusInput;
}

const detailFixture: ShipmentDetailView = {
  orderId: 101,
  ghnOrderCode: "GHN101",
  localStatus: "shipping",
  ghnStatus: "delivery_fail",
  rawGhnStatus: "delivery_fail",
  buyerName: "Buyer One",
  buyerEmail: "buyer@example.com",
  sellerName: "Seller One",
  receiver: {
    name: "Receiver One",
    phone: "0900000000",
    address: "12 Nguyen Trai",
    ward: "Ward 1",
    district: "District 1",
    province: "HCMC",
  },
  paymentMethod: "cod",
  codAmount: 250000,
  shippingFee: 30000,
  total: 280000,
  items: [
    {
      id: 1,
      name: "Coffee Beans",
      image: null,
      quantity: 2,
      unitPrice: 125000,
      skuLabel: "500g",
    },
  ],
  productSummary: "Coffee Beans x2",
  createdAt: "2026-06-27T08:00:00.000Z",
  updatedAt: "2026-06-27T09:00:00.000Z",
  lastSyncedAt: "2026-06-27T09:30:00.000Z",
  ghn: {
    expected: "2026-06-28T09:00:00.000Z",
    leadtime: "2026-06-28T10:00:00.000Z",
    totalFee: 30000,
    fromName: "TryBuy Warehouse",
    fromPhone: "0900111222",
  },
  ghnDetailError: null,
  canSync: true,
  availableActions: ["sync", "cancel", "return"],
};

const historyFixture: ShipmentHistoryRow[] = [
  {
    id: 1,
    type: "manual_sync",
    action: "sync",
    previousStatus: "processing",
    newStatus: "delivering",
    ghnStatus: "delivery_fail",
    success: true,
    message: "Synced from GHN",
    actorId: 7,
    createdAt: "2026-06-27T09:30:00.000Z",
  },
];

describe("ShipmentDetail", () => {
  const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
  const useToastMock = useToast as jest.MockedFunction<typeof useToast>;
  const useShipmentDetailMock = useShipmentDetail as jest.MockedFunction<
    typeof useShipmentDetail
  >;
  const useShipmentHistoryMock = useShipmentHistory as jest.MockedFunction<
    typeof useShipmentHistory
  >;
  const useSyncShipmentMock = useSyncShipment as jest.MockedFunction<
    typeof useSyncShipment
  >;
  const useShipmentActionMock = useShipmentAction as jest.MockedFunction<
    typeof useShipmentAction
  >;
  const useSetDemoStatusMock = useSetDemoStatus as jest.MockedFunction<
    typeof useSetDemoStatus
  >;
  const pushMock = jest.fn();
  const syncMutateMock = jest.fn<void, [number, ShipmentSyncOptions?]>();
  const actionMutateMock = jest.fn<
    void,
    [ShipmentActionInput, ShipmentActionOptions?]
  >();
  const demoMutateMock = jest.fn<
    void,
    [SetDemoStatusMutationInput, ShipmentSyncOptions?]
  >();

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_GHN_DEMO_MODE;
    useAuthMock.mockReturnValue({
      user: {
        id: 1,
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
    useToastMock.mockReturnValue({
      toasts: [],
      push: pushMock,
      dismiss: jest.fn(),
    });
    useShipmentDetailMock.mockReturnValue({
      data: detailFixture,
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentDetail>);
    useShipmentHistoryMock.mockReturnValue({
      data: historyFixture,
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentHistory>);
    useSyncShipmentMock.mockReturnValue({
      mutate: syncMutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof useSyncShipment>);
    useShipmentActionMock.mockReturnValue({
      mutate: actionMutateMock,
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useShipmentAction>);
    useSetDemoStatusMock.mockReturnValue({
      mutate: demoMutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof useSetDemoStatus>);
  });

  it("renders detail, timeline, last sync, and backend-available actions", () => {
    render(<ShipmentDetail orderId={101} />);

    expect(screen.getByRole("heading", { name: "#101" })).toBeInTheDocument();
    expect(screen.getByText("Receiver One")).toBeInTheDocument();
    expect(screen.getByText("Sync GHN status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel shipment/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Return to seller/i })).toBeEnabled();
    expect(screen.getByText(/Manual sync/i)).toBeInTheDocument();
    expect(screen.getByText("Last synced")).toBeInTheDocument();
    expect(screen.getByText("Synced from GHN")).toBeInTheDocument();
  });

  it("shows the GHN rejection toast for 500 action failures", async () => {
    actionMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(new ApiError("Carrier rejected the request", 500));
    });
    render(<ShipmentDetail orderId={101} />);

    await userEvent.click(screen.getByRole("button", { name: /Cancel shipment/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "error",
          title: "GHN rejected the action",
        }),
      );
    });
  });

  it("shows a normal action failure toast for 400 validation errors", async () => {
    actionMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(new ApiError("Order cannot be cancelled", 400));
    });
    render(<ShipmentDetail orderId={101} />);

    await userEvent.click(screen.getByRole("button", { name: /Cancel shipment/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "error",
          title: "Cancel shipment failed",
          message: "Order cannot be cancelled",
        }),
      );
    });
  });

  it("syncs through the mutation hook and reports success", async () => {
    syncMutateMock.mockImplementation((_orderId, options) => {
      options?.onSuccess?.({
        orderId: 101,
        previousStatus: "shipping",
        newStatus: "shipping",
        ghnStatus: "delivering",
        syncedAt: "2026-06-27T10:00:00.000Z",
      });
    });
    render(<ShipmentDetail orderId={101} />);

    await userEvent.click(screen.getByRole("button", { name: /Sync GHN status/i }));

    await waitFor(() => {
      expect(syncMutateMock).toHaveBeenCalledWith(101, expect.any(Object));
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "success",
          title: "GHN status synced",
        }),
      );
    });
  });

  it("shows non-retryable copy when GHN cannot resolve the waybill", async () => {
    syncMutateMock.mockImplementation((_orderId, options) => {
      options?.onError?.(
        new ApiError("GHN order GHN101 not found: OrderCode not found", 404),
      );
    });
    render(<ShipmentDetail orderId={101} />);

    await userEvent.click(screen.getByRole("button", { name: /Sync GHN status/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "error",
          title: "GHN waybill not found",
          message: expect.stringContaining("not retryable"),
        }),
      );
    });
  });

  it("hides demo controls unless demo mode is enabled", () => {
    render(<ShipmentDetail orderId={101} />);

    expect(screen.queryByText("Demo controls")).not.toBeInTheDocument();
  });

  it("applies a demo status through the demo mutation when enabled", async () => {
    process.env.NEXT_PUBLIC_GHN_DEMO_MODE = "true";
    demoMutateMock.mockImplementation((_input, options) => {
      options?.onSuccess?.({
        orderId: 101,
        previousStatus: "shipping",
        newStatus: "shipping",
        ghnStatus: "waiting_to_return",
        syncedAt: "2026-06-27T10:00:00.000Z",
      });
    });

    render(<ShipmentDetail orderId={101} />);

    expect(screen.getByText("Demo controls")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Apply demo status/i }));

    await waitFor(() => {
      expect(demoMutateMock).toHaveBeenCalledWith(
        {
          orderId: 101,
          body: { ghnStatus: "waiting_to_return" },
        },
        expect.any(Object),
      );
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "success",
          title: "Demo status applied",
        }),
      );
    });
  });

  it("shows demo-disabled 403 as environment feedback", async () => {
    process.env.NEXT_PUBLIC_GHN_DEMO_MODE = "true";
    demoMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(
        new ApiError("GHN demo status endpoint is disabled", 403),
      );
    });

    render(<ShipmentDetail orderId={101} />);

    await userEvent.click(screen.getByRole("button", { name: /Apply demo status/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "info",
          title: "Demo mode not enabled",
        }),
      );
    });
  });
});
