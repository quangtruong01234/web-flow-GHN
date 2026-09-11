import { render, screen } from "@testing-library/react";
import { shipmentListItem } from "../testing/fixtures";
import { ShipmentStatCards } from "./ShipmentStatCards";

// The dashboard reads one page of orders, so every count here is computed over a
// window. When the queue is bigger than that window the figures are a floor, and
// "Failed deliveries: 3" must not read as "only 3 orders failed" — the operator
// treats that card as a work queue.
describe("ShipmentStatCards", () => {
  const items = [
    shipmentListItem({
      orderId: "ord_aaaaaaaaaaaaaaaa",
      ghnStatus: "delivery_fail",
      rawGhnStatus: "delivery_fail",
    }),
    shipmentListItem({ orderId: "ord_bbbbbbbbbbbbbbbb" }),
    shipmentListItem({ orderId: "ord_cccccccccccccccc" }),
  ];

  it("marks counts as a floor when the queue is larger than the window", () => {
    render(<ShipmentStatCards items={items} total={170} />);

    expect(screen.getByText("2+")).toBeInTheDocument(); // active
    expect(screen.getByText("1+")).toBeInTheDocument(); // failed
    expect(
      screen.getByText(/counted over the 3 most recent orders, not all 170/i),
    ).toBeInTheDocument();
  });

  it("reports exact counts when the window covers the whole queue", () => {
    render(<ShipmentStatCards items={items} total={items.length} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("1+")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/most recent orders, not all/i),
    ).not.toBeInTheDocument();
  });
});
