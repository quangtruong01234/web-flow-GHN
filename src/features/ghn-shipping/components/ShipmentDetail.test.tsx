import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import type {
  ShipmentActionView,
  ShipmentManualAction,
  SetDemoStatusInput,
  ShipmentSyncView,
} from "../api/types";
import {
  ACTOR_PUBLIC_ID,
  authUser,
  ORDER_PUBLIC_ID,
  shipmentDetailView,
  shipmentHistoryRow,
  shipmentSyncView,
} from "../testing/fixtures";
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
  // Mounted only when `availableActions` advertises the waybill edits.
  useUpdateCod: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
  useUpdateReceiver: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));

interface ShipmentActionInput {
  orderId: string;
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
  orderId: string;
  body: SetDemoStatusInput;
}

const detailFixture = shipmentDetailView({
  ghnStatus: "delivery_fail",
  rawGhnStatus: "delivery_fail",
});

const historyFixture = [shipmentHistoryRow({ ghnStatus: "delivery_fail" })];

/**
 * Cancel and return are one-way, so they go through a confirm dialog. The
 * dialog's confirm button repeats the action label, hence the `within` scope —
 * a bare `getByRole` would now match two buttons.
 */
async function clickAndConfirm(label: RegExp): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: label }));
  const dialog = screen.getByRole("dialog");
  await userEvent.click(within(dialog).getByRole("button", { name: label }));
}

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
  const syncMutateMock = jest.fn<void, [string, ShipmentSyncOptions?]>();
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
      user: authUser("shipping_manager"),
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
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.getByRole("heading", { name: `#${ORDER_PUBLIC_ID}` })).toBeInTheDocument();
    expect(screen.getByText("Receiver One")).toBeInTheDocument();
    expect(screen.getByText("Sync GHN status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel shipment/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Return to seller/i })).toBeEnabled();
    expect(screen.getByText(/Manual sync/i)).toBeInTheDocument();
    expect(screen.getByText("Last synced")).toBeInTheDocument();
    expect(screen.getByText("Synced from GHN")).toBeInTheDocument();
  });

  // GHN-ACT-01: the array is the single source of truth. A shipping_manager on an
  // order the gateway offers nothing for still sees a read-only panel...
  it("falls back to a read-only panel when the backend offers no actions", () => {
    useShipmentDetailMock.mockReturnValue({
      data: shipmentDetailView({
        canSync: false,
        availableActions: ["read", "history"],
      }),
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentDetail>);

    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.getByText(/lists no carrier actions for this shipment/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sync GHN status/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Cancel shipment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Update COD/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Update receiver info/i })).not.toBeInTheDocument();
  });

  // ...and a logistics_operator handed the full array gets every button, because
  // the gateway would not have advertised them without the permission.
  it("renders every advertised action without re-checking the role", () => {
    useAuthMock.mockReturnValue({
      user: authUser("logistics_operator"),
      ready: true,
      login: jest.fn(),
      logout: jest.fn(),
    });
    useShipmentDetailMock.mockReturnValue({
      data: shipmentDetailView({
        availableActions: ["sync", "cancel", "return", "update_cod", "update_receiver"],
      }),
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentDetail>);

    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.getByRole("button", { name: /Sync GHN status/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Cancel shipment/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Return to seller/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Update COD/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Update receiver info/i })).toBeEnabled();
    expect(screen.queryByText(/lists no carrier actions/i)).not.toBeInTheDocument();
  });

  // GHN-HIST-01: the actor is an opaque public id — never decorated with "#".
  it("attributes a timeline entry to the opaque actor id", () => {
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    const actor = screen.getByText(new RegExp(`by operator ${ACTOR_PUBLIC_ID}`));
    expect(actor).toBeInTheDocument();
    expect(actor.textContent).not.toContain(`#${ACTOR_PUBLIC_ID}`);
  });

  it("shows the GHN rejection toast for 500 action failures", async () => {
    actionMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(new ApiError("Carrier rejected the request", 500));
    });
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await clickAndConfirm(/Cancel shipment/i);

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
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await clickAndConfirm(/Cancel shipment/i);

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

  // RESIL-01: the new contract moves a GHN refusal from 500 to 400 and adds 503
  // for an unreachable carrier. Both must keep GHN's own message.
  it("shows the GHN rejection toast for a prefixed 400 action failure", async () => {
    actionMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(
        new ApiError("GHN cancel error: Order has been picked up", 400),
      );
    });
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await clickAndConfirm(/Cancel shipment/i);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "error",
          title: "GHN rejected the action",
          message: expect.stringContaining("Order has been picked up"),
        }),
      );
    });
  });

  it("shows a retryable outage toast when GHN is unreachable (503)", async () => {
    actionMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(new ApiError("GHN cancel request failed", 503));
    });
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await clickAndConfirm(/Cancel shipment/i);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "error",
          title: "GHN temporarily unavailable",
          message: expect.stringContaining("retry in a moment"),
        }),
      );
    });
  });

  // Cancel kills the GHN waybill for good and return puts the parcel on a leg
  // back to the seller. Neither is reversible from this console, so neither may
  // fire on a single click.
  it("does not call the carrier until the destructive action is confirmed", async () => {
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await userEvent.click(screen.getByRole("button", { name: /Cancel shipment/i }));

    expect(actionMutateMock).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /cancel this shipment\?/i });
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: /Cancel shipment/i }));

    await waitFor(() => {
      expect(actionMutateMock).toHaveBeenCalledWith(
        { orderId: ORDER_PUBLIC_ID, action: "cancel" },
        expect.any(Object),
      );
    });
  });

  it("abandons the action when the operator backs out of the dialog", async () => {
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await userEvent.click(screen.getByRole("button", { name: /Return to seller/i }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /Keep as is/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(actionMutateMock).not.toHaveBeenCalled();
  });

  it("confirms the return action separately from cancel", async () => {
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await clickAndConfirm(/Return to seller/i);

    await waitFor(() => {
      expect(actionMutateMock).toHaveBeenCalledWith(
        { orderId: ORDER_PUBLIC_ID, action: "return" },
        expect.any(Object),
      );
    });
  });

  it("syncs through the mutation hook and reports success", async () => {
    syncMutateMock.mockImplementation((_orderId, options) => {
      options?.onSuccess?.(shipmentSyncView());
    });
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    await userEvent.click(screen.getByRole("button", { name: /Sync GHN status/i }));

    await waitFor(() => {
      expect(syncMutateMock).toHaveBeenCalledWith(ORDER_PUBLIC_ID, expect.any(Object));
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
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

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

  // GHN-FAIL-NTF-01: sync is no longer a pure read. The note belongs next to a
  // button the operator can actually press — a disabled one warns about nothing.
  it("warns at the sync button that the buyer may be notified", () => {
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.getByText(/not read-only/i)).toBeInTheDocument();
    expect(screen.getByText(/the buyer is notified once/i)).toBeInTheDocument();
  });

  it("drops the sync warning when the backend offers no sync action", () => {
    useShipmentDetailMock.mockReturnValue({
      data: shipmentDetailView({
        canSync: false,
        availableActions: ["read", "history"],
      }),
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentDetail>);

    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.queryByText(/not read-only/i)).not.toBeInTheDocument();
    expect(screen.getByText(/syncing is not available for this shipment/i)).toBeInTheDocument();
  });

  it("hides demo controls unless demo mode is enabled", () => {
    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.queryByText("Demo controls")).not.toBeInTheDocument();
  });

  it("applies a demo status through the demo mutation when enabled", async () => {
    process.env.NEXT_PUBLIC_GHN_DEMO_MODE = "true";
    demoMutateMock.mockImplementation((_input, options) => {
      options?.onSuccess?.(shipmentSyncView({ ghnStatus: "waiting_to_return" }));
    });

    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.getByText("Demo controls")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Apply demo status/i }));

    await waitFor(() => {
      expect(demoMutateMock).toHaveBeenCalledWith(
        {
          orderId: ORDER_PUBLIC_ID,
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

  // GHN-FAIL-NTF-01: only the carrier call is simulated. A demo `delivery_fail`
  // writes a real status, so the buyer gets the same real notification.
  it("warns that a demo delivery failure notifies the buyer for real", async () => {
    process.env.NEXT_PUBLIC_GHN_DEMO_MODE = "true";
    useShipmentDetailMock.mockReturnValue({
      data: shipmentDetailView({ ghnStatus: "delivering", rawGhnStatus: "delivering" }),
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShipmentDetail>);

    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

    expect(screen.queryByText(/the buyer is notified for real/i)).not.toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText(/set ghn status/i),
      "delivery_fail",
    );

    expect(screen.getByText(/the buyer is notified for real/i)).toBeInTheDocument();
  });

  it("shows demo-disabled 403 as environment feedback", async () => {
    process.env.NEXT_PUBLIC_GHN_DEMO_MODE = "true";
    demoMutateMock.mockImplementation((_input, options) => {
      options?.onError?.(
        new ApiError("GHN demo status endpoint is disabled", 403),
      );
    });

    render(<ShipmentDetail orderId={ORDER_PUBLIC_ID} />);

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
