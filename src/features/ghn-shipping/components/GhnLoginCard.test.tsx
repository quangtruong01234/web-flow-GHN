import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type AuthUser, useAuth } from "@/context/AuthContext";
import { GhnLoginCard } from "./GhnLoginCard";

const replaceMock = jest.fn();
const getSearchParamMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({ get: getSearchParamMock }),
}));

jest.mock("@/context/AuthContext", () => ({
  isAllowedRole: (role: string | undefined) =>
    role === "logistics_operator" || role === "shipping_manager",
  useAuth: jest.fn(),
}));

function authUser(role: AuthUser["role"]): AuthUser {
  return {
    id: 1,
    username: "shipmgr_test",
    name: "Shipping Manager",
    email: "shipmgr@example.com",
    role,
    title: "Shipping Manager",
  };
}

describe("GhnLoginCard", () => {
  const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;
  const loginMock = jest.fn<Promise<AuthUser>, [string, string]>();

  beforeEach(() => {
    jest.clearAllMocks();
    getSearchParamMock.mockReturnValue("/shipments");
    useAuthMock.mockReturnValue({
      user: null,
      ready: true,
      login: loginMock,
      logout: jest.fn<Promise<void>, []>(),
    });
  });

  it("validates empty credentials before calling login", async () => {
    render(<GhnLoginCard />);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      screen.getByText("Enter both your username and password to continue."),
    ).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("logs in with username/password and respects a safe next path", async () => {
    loginMock.mockResolvedValue(authUser("shipping_manager"));
    render(<GhnLoginCard />);

    await userEvent.type(screen.getByLabelText("Username"), " shipmgr_test ");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("shipmgr_test", "secret");
      expect(replaceMock).toHaveBeenCalledWith("/shipments");
    });
  });

  it("sends a successfully authenticated but disallowed role to forbidden", async () => {
    loginMock.mockResolvedValue(authUser("shop"));
    render(<GhnLoginCard />);

    await userEvent.type(screen.getByLabelText("Username"), "shop_user");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/403");
    });
  });
});
