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
        productId: 7,
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
    expect(screen.getByText(/By revenue, completed orders/)).toBeInTheDocument();
    expect(screen.getByText(/revenue counts completed orders only/)).toBeInTheDocument();
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
});
