import { render, screen } from "@testing-library/react";
import { useGatewayClosingSoon } from "@/hooks/useGatewayClosingSoon";
import { useGatewayHealth } from "@/hooks/useGatewayHealth";
import { BackendStatusBanner } from "./BackendStatusBanner";

jest.mock("@/hooks/useGatewayHealth", () => ({
  useGatewayHealth: jest.fn(),
}));

jest.mock("@/hooks/useGatewayClosingSoon", () => ({
  useGatewayClosingSoon: jest.fn(),
}));

const useGatewayClosingSoonMock = useGatewayClosingSoon as jest.MockedFunction<
  typeof useGatewayClosingSoon
>;

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
    useGatewayClosingSoonMock.mockReturnValue(null);
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

describe("BackendStatusBanner closing-soon notice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("warns before the scheduled stop while the gateway answers", () => {
    mockHealth("online");
    useGatewayClosingSoonMock.mockReturnValue(7);

    render(<BackendStatusBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /scheduled to stop at 19:00 ICT \(UTC\+7\), in about 7 min/,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/Finish any edit in progress/);
    expect(screen.queryByRole("link", { name: "Sample console" })).toBeNull();
  });

  it("stays quiet outside the warning window", () => {
    mockHealth("online");
    useGatewayClosingSoonMock.mockReturnValue(null);

    const { container } = render(<BackendStatusBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  // Same rule as the offline notice: no claim about the gateway before the
  // first probe has answered.
  it("does not warn before the first probe settles", () => {
    mockHealth("unknown");
    useGatewayClosingSoonMock.mockReturnValue(7);

    const { container } = render(<BackendStatusBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the offline notice, not the countdown, once the gateway stops answering", () => {
    mockHealth("offline");
    useGatewayClosingSoonMock.mockReturnValue(1);

    render(<BackendStatusBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(/scheduled to run 14:00–19:00 ICT/);
    expect(screen.getByRole("status")).not.toHaveTextContent(/in about/);
  });
});
