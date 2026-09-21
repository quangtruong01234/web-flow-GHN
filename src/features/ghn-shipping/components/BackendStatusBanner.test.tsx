import { render, screen } from "@testing-library/react";
import { useGatewayHealth } from "@/hooks/useGatewayHealth";
import { BackendStatusBanner } from "./BackendStatusBanner";

jest.mock("@/hooks/useGatewayHealth", () => ({
  useGatewayHealth: jest.fn(),
}));

const useGatewayHealthMock = useGatewayHealth as jest.MockedFunction<
  typeof useGatewayHealth
>;

function mockHealth(status: "unknown" | "online" | "offline"): void {
  useGatewayHealthMock.mockReturnValue({
    status,
    isOffline: status === "offline",
    checkedAt: status === "unknown" ? null : "2026-09-18T11:42:00+07:00",
  });
}

describe("BackendStatusBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_DEMO_GUIDE_URL;
  });

  // The banner sits above every page, so a false positive is expensive: it would
  // tell an operator the backend is down while their screens load fine.
  it("renders nothing before the first probe settles", () => {
    mockHealth("unknown");

    const { container } = render(<BackendStatusBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the gateway answers", () => {
    mockHealth("online");

    const { container } = render(<BackendStatusBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("explains the hosting window and offers the sample console when offline", () => {
    mockHealth("offline");

    render(<BackendStatusBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /Backend is scheduled to run 14:00–19:00 ICT/,
    );
    expect(screen.getByRole("link", { name: "Sample console" })).toHaveAttribute(
      "href",
      "/demo",
    );
  });

  // The URL is author-supplied and absent in a fresh clone. Rendering the link
  // anyway would put a dead anchor in front of the first visitor.
  it("omits the guide link when its env var is unset", () => {
    mockHealth("offline");

    render(<BackendStatusBanner />);

    expect(screen.queryByRole("link", { name: "Demo guide" })).toBeNull();
  });

  it("links the guide when its env var is set", () => {
    process.env.NEXT_PUBLIC_DEMO_GUIDE_URL = "https://example.com/demo-guide";
    mockHealth("offline");

    render(<BackendStatusBanner />);

    expect(screen.getByRole("link", { name: "Demo guide" })).toHaveAttribute(
      "href",
      "https://example.com/demo-guide",
    );
  });

  // There is no walkthrough video and none is planned; the banner must not
  // offer one in any state.
  it("never advertises a walkthrough video", () => {
    mockHealth("offline");

    render(<BackendStatusBanner />);

    expect(screen.getByRole("status")).not.toHaveTextContent(/walkthrough/i);
  });
});
