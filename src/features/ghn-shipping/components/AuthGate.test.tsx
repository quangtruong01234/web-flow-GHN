import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { authApi } from "@/lib/auth-api";
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
});
