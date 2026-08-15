import { render, screen } from "@testing-library/react";
import type { AnalyticsView } from "../api/analytics";
import { useAnalytics } from "../hooks/useAnalytics";
import { AnalyticsPanel } from "./AnalyticsPanel";

jest.mock("../hooks/useAnalytics", () => ({
  useAnalytics: jest.fn(),
}));

// GHN-RBAC-01: the analytics endpoint answers 200 for logistics_operator but
// omits the four monetary fields, which the adapter turns into `revenueVisible:
// false` plus `null` money. The panel must then hide money instead of printing
// zeroes, and switch the chart/table to order volume.
function analyticsView(revenueVisible: boolean): AnalyticsView {
  return {
    from: "2026-07-13T00:00:00.000Z",
    to: "2026-08-12T23:59:59.999Z",
    interval: "day",
    summary: {
      totalRevenue: revenueVisible ? 12_500_000 : null,
      completedOrders: 5,
      totalOrders: 30,
      averageOrderValue: revenueVisible ? 2_500_000 : null,
    },
    revenueVisible,
    revenueOverTime: [
      { period: "2026-08-03", revenue: revenueVisible ? 1_000_000 : null, orderCount: 2 },
      { period: "2026-08-11", revenue: revenueVisible ? 500_000 : null, orderCount: 3 },
    ],
    statusDistribution: [
      {
        status: "completed",
        label: "Completed",
        barClass: "bg-emerald-500",
        count: 5,
      },
    ],
    topProducts: [
      {
        productId: "prod_ffc7fc2281d211f1",
        name: "Samsung 990 Pro 1TB NVMe SSD",
        quantitySold: 2,
        revenue: revenueVisible ? 3_600_000 : null,
      },
    ],
  };
}

describe("AnalyticsPanel", () => {
  const useAnalyticsMock = useAnalytics as jest.MockedFunction<typeof useAnalytics>;

  function mockView(revenueVisible: boolean): void {
    useAnalyticsMock.mockReturnValue({
      data: analyticsView(revenueVisible),
      isPending: false,
      isError: false,
      isPlaceholderData: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useAnalytics>);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows revenue KPIs, the revenue chart, and the revenue column when visible", () => {
    mockView(true);

    render(<AnalyticsPanel />);

    expect(screen.getByText("Revenue (completed)")).toBeInTheDocument();
    expect(screen.getByText("Avg order value")).toBeInTheDocument();
    expect(screen.getByText("Revenue over time")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByText(/revenue counts completed orders only/)).toBeInTheDocument();
  });

  // The backend ranks topProducts by quantitySold for every role, so the caption
  // must say so in both branches. It used to claim "By revenue" whenever the
  // money column was visible, which contradicted the rows on screen.
  it("captions the top-product ranking as quantity sold in both roles", () => {
    mockView(true);
    const { unmount } = render(<AnalyticsPanel />);
    expect(screen.getByText(/By quantity sold, completed orders/)).toBeInTheDocument();
    expect(screen.queryByText(/By revenue/)).not.toBeInTheDocument();
    unmount();

    mockView(false);
    render(<AnalyticsPanel />);
    expect(screen.getByText(/By quantity sold, completed orders/)).toBeInTheDocument();
  });

  // GHN-RBAC-01 again: the column is visible, but this one row has no figure.
  // A dash says "not reported"; a zero would say "sold nothing".
  it("dashes a missing product revenue instead of printing a zero", () => {
    const view = analyticsView(true);
    useAnalyticsMock.mockReturnValue({
      data: {
        ...view,
        topProducts: [
          { productId: "prod_ffc7fc2281d211f1", name: "No figure", quantitySold: 2, revenue: null },
        ],
      },
      isPending: false,
      isError: false,
      isPlaceholderData: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useAnalytics>);

    render(<AnalyticsPanel />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0 VND")).not.toBeInTheDocument();
  });

  it("hides every money field and plots order volume when revenue is omitted", () => {
    mockView(false);

    render(<AnalyticsPanel />);

    expect(screen.queryByText("Revenue (completed)")).not.toBeInTheDocument();
    expect(screen.queryByText("Avg order value")).not.toBeInTheDocument();
    expect(screen.queryByText("Revenue over time")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Revenue" }),
    ).not.toBeInTheDocument();

    // The volume fallbacks the operator sees instead.
    expect(screen.getByText("Completed orders over time")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Completed orders over time bar chart" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/By quantity sold, completed orders/)).toBeInTheDocument();
    expect(screen.getByText(/revenue figures are hidden for your role/)).toBeInTheDocument();

    // Counts stay — hiding money must not hide the order figures.
    expect(screen.getByText("Completed orders")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("never renders a zero in place of a hidden revenue figure", () => {
    mockView(false);

    render(<AnalyticsPanel />);

    expect(screen.queryByText("0 VND")).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.0M VND/)).not.toBeInTheDocument();
  });

  // IDLEAK-02: several top products can be `null` at once (deleted catalog rows,
  // or the product service being down). Keying rows on `productId` alone would
  // then collide and React would reconcile the wrong row.
  it("renders every top product when the ids are unresolved", () => {
    const view = analyticsView(true);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    useAnalyticsMock.mockReturnValue({
      data: {
        ...view,
        topProducts: [
          { productId: null, name: "Deleted product A", quantitySold: 4, revenue: 1_000 },
          { productId: null, name: "Deleted product B", quantitySold: 3, revenue: 900 },
          {
            productId: "prod_ffc4fcfc81d211f1",
            name: "Live product",
            quantitySold: 2,
            revenue: 800,
          },
        ],
      },
      isPending: false,
      isError: false,
      isPlaceholderData: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useAnalytics>);

    render(<AnalyticsPanel />);

    expect(screen.getByText("Deleted product A")).toBeInTheDocument();
    expect(screen.getByText("Deleted product B")).toBeInTheDocument();
    expect(screen.getByText("Live product")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
