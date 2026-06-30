import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { authApi, type BackendMeUser } from "@/lib/auth-api";
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

function userWithRole(role: NonNullable<BackendMeUser["role"]>["rol_name"]): BackendMeUser {
  return {
    id: 1,
    username: "logistics_test",
    email: "logistics@example.com",
    name: "Logistics Test",
    avatar: null,
    isActive: true,
    role: {
      rol_id: 10,
      rol_name: role,
      rol_slug: role,
      rol_status: "active",
      rol_description: "",
      rol_grants: [],
    },
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
  };
}

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
    meMock.mockResolvedValue(userWithRole("logistics_operator"));

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
    meMock.mockResolvedValue(userWithRole("shop"));

    renderGate();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/403");
    });
  });
});
