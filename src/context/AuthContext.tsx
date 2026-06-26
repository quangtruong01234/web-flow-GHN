"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type MockRole = "logistics_operator" | "shipping_manager";

export const ALLOWED_ROLES: MockRole[] = ["logistics_operator", "shipping_manager"];

export interface AuthUser {
  name: string;
  role: MockRole;
  title: string;
  email: string;
}

const DEMO_USER: AuthUser = {
  name: "Trần Thị Mai",
  role: "logistics_operator",
  title: "Logistics Operator",
  email: "mai.logistics@trybuy.demo",
};

const STORAGE_KEY = "ghn.mock.auth";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => AuthUser;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && typeof parsed.email === "string" && parsed.role) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStored());
    setReady(true);
  }, []);

  const login = useCallback((email: string, _password: string) => {
    const next: AuthUser = { ...DEMO_USER, email: email.trim() || DEMO_USER.email };
    setUser(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable; in-memory state still works */
    }
    return next;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
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
