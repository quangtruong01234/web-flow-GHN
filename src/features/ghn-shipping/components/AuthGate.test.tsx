import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { authApi } from "@/lib/auth-api";
import { notifySessionExpired } from "@/lib/session-expiry";
import { backendMeUser } from "../testing/fixtures";
import { AuthGate } from "./AuthGate";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/shipments",
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("@/lib/auth-api", () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  },
}));

function renderGate(): void {
  render(
    <AuthProvider>
      <AuthGate>
        <div>Protected console</div>
      </AuthGate>
    </AuthProvider>,
  );
}

describe("AuthGate", () => {
  const meMock = authApi.me as jest.MockedFunction<typeof authApi.me>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders protected content for an allowed logistics role", async () => {
    meMock.mockResolvedValue(backendMeUser("logistics_operator"));

    renderGate();

    expect(await screen.findByText("Protected console")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login with the current path", async () => {
    meMock.mockRejectedValue(new Error("Unauthenticated"));

    renderGate();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?next=%2Fshipments");
    });
  });

  it("redirects authenticated users with a disallowed role to forbidden", async () => {
    meMock.mockResolvedValue(backendMeUser("shop"));

    renderGate();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/403");
    });
  });

  // risks.md item 22: a disallowed role is a non-null `user`, so the shell used to
  // paint (and fire its gateway reads) for the frame before /403 landed. The
  // gateway grants generic `admin` read access to the GHN routes, so that frame
  // leaked real shipment data to the role this console exists to bounce.
  it("never renders protected content for a disallowed role", async () => {
    meMock.mockResolvedValue(backendMeUser("shop"));

    renderGate();
    expect(screen.queryByText("Protected console")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/403");
    });
    expect(screen.queryByText("Protected console")).not.toBeInTheDocument();
    expect(screen.getByText("Checking your session...")).toBeInTheDocument();
  });

  // risks.md item 21: the cookie can expire while the console is open, long
  // after the one-shot `/me` hydration. The 401 has to send the operator back to
  // /login carrying the path, not leave them on a Retry button that only 401s.
  it("returns to login with the current path when the session expires mid-session", async () => {
    meMock.mockResolvedValue(backendMeUser("shipping_manager"));

    renderGate();
    expect(await screen.findByText("Protected console")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    act(() => {
      notifySessionExpired();
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?next=%2Fshipments");
    });
    expect(screen.queryByText("Protected console")).not.toBeInTheDocument();
  });
});
