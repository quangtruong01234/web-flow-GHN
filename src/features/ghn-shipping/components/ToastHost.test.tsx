import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { ToastHost } from "./ToastHost";

function Trigger() {
  const { push } = useToast();
  return (
    <button onClick={() => push({ kind: "success", title: "Sync complete" })}>
      push
    </button>
  );
}

function setup() {
  return render(
    <ToastProvider>
      <Trigger />
      <ToastHost />
    </ToastProvider>,
  );
}

/**
 * Sync and carrier-action results are announced nowhere but the toast, so the
 * live region has to exist before the text lands in it — a region inserted in
 * the same commit as its content is routinely missed by screen readers.
 */
describe("ToastHost", () => {
  it("keeps the live region mounted while empty", () => {
    setup();

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBeEmptyDOMElement();
  });

  it("announces a toast inside the region that was already there", async () => {
    setup();
    const region = screen.getByRole("status");

    await userEvent.click(screen.getByRole("button", { name: "push" }));

    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Sync complete");
  });
});
