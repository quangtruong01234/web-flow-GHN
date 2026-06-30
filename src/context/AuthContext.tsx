"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  type BackendLoginUser,
  type BackendMeUser,
} from "@/lib/auth-api";

/** GHN console roles allowed into the protected area. */
export const ALLOWED_ROLES: readonly string[] = [
  "logistics_operator",
  "shipping_manager",
];

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  /** Raw backend `rol_name`; may be outside ALLOWED_ROLES (e.g. shop/user). */
  role: string;
  title: string;
}

const ROLE_TITLE: Record<string, string> = {
  logistics_operator: "Logistics Operator",
  shipping_manager: "Shipping Manager",
  shop: "Shop owner",
  user: "Customer",
};

function titleForRole(role: string): string {
  return ROLE_TITLE[role] ?? "Operator";
}

export function isAllowedRole(role: string | undefined): boolean {
  return role !== undefined && ALLOWED_ROLES.includes(role);
}

/** A GHN sync is a status mutation, restricted to shipping managers. */
export function canSync(role: string | undefined): boolean {
  return role === "shipping_manager";
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Both `/login` and `/me` return the same user shape (role eager-loaded), so a
// single mapper drives both paths. No identity is stored in the browser — the
// credential lives in the HttpOnly cookie and `/me` is authoritative on reload.
function toAuthUser(backend: BackendLoginUser | BackendMeUser): AuthUser {
  const role = backend.role?.rol_name ?? "user";
  return {
    id: backend.id,
    username: backend.username,
    name: backend.name ?? backend.username,
    email: backend.email,
    role,
    title: titleForRole(role),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((me: BackendMeUser) => {
        if (!active) return;
        setUser(toAuthUser(me));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const backend = await authApi.login(username, password);
    const next = toAuthUser(backend);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
