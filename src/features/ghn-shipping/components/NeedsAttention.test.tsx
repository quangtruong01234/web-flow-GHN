import { render, screen } from "@testing-library/react";
import { shipmentListItem } from "../testing/fixtures";
import { NeedsAttentionCard, NeedsAttentionChips } from "./NeedsAttention";

const items = [
  shipmentListItem({
    orderId: "ord_aaaaaaaaaaaaaaaa",
    ghnStatus: "delivery_fail",
    rawGhnStatus: "delivery_fail",
  }),
  shipmentListItem({ orderId: "ord_bbbbbbbbbbbbbbbb", ghnStatus: null, rawGhnStatus: "lost" }),
  shipmentListItem({ orderId: "ord_cccccccccccccccc" }),
];

describe("NeedsAttentionCard", () => {
  it("links each status to one filtered list", () => {
    render(<NeedsAttentionCard items={items} total={items.length} />);

    expect(screen.getByRole("link", { name: /delivery failed/i })).toHaveAttribute(
      "href",
      "/shipments?ghnStatus=delivery_fail",
    );
    for (const status of ["exception", "damage", "lost"]) {
      expect(screen.getByRole("link", { name: new RegExp(status, "i") })).toHaveAttribute(
        "href",
        `/shipments?ghnStatus=${status}`,
      );
    }
  });

  it("reports exact current counts when the window covers the queue", () => {
    render(<NeedsAttentionCard items={items} total={items.length} />);

    expect(screen.getByRole("link", { name: /delivery failed/i })).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: /lost/i })).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: /damage/i })).toHaveTextContent("0");
    expect(screen.queryByText(/\d\+/)).not.toBeInTheDocument();
  });

  // risks 25: a count over a window is a floor, never a queue total.
  it("marks counts as a floor when the queue is larger than the window", () => {
    render(<NeedsAttentionCard items={items} total={170} />);

    expect(screen.getByRole("link", { name: /delivery failed/i })).toHaveTextContent("1+");
    expect(screen.getByText(/newest 3 of 170 orders/i)).toBeInTheDocument();
  });

  // The list filter is a `shipping_history` subquery, so it can return more
  // orders than the card counts — the copy has to say why.
  it("explains that the list matches every order that ever recorded the status", () => {
    render(<NeedsAttentionCard items={items} total={items.length} />);

    expect(screen.getByText(/ever recorded this GHN status/i)).toBeInTheDocument();
  });
});

describe("NeedsAttentionChips", () => {
  it("marks the applied quick filter", () => {
    render(<NeedsAttentionChips active="exception" />);

    expect(screen.getByRole("link", { name: /exception/i })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: /lost/i })).not.toHaveAttribute("aria-current");
  });
});
