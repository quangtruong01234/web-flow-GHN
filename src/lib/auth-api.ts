import { request } from "./api";

// Auth contracts verified against the backend gateway (read-only). See
// .ai/context/data-fetching.md. Login authenticates by `username` (not email)
// and sets an HttpOnly `access_token` cookie. `/me` now returns `role` with the
// same shape as login, so it is authoritative for re-gating on reload — no
// client-side role caching is needed.

export type BackendRoleName =
  | "admin"
  | "shop"
  | "user"
  | "logistics_operator"
  | "shipping_manager";

export interface BackendRole {
  rol_id: number;
  rol_name: BackendRoleName;
  rol_slug: string;
  rol_status: string;
  rol_description: string;
  rol_grants: unknown[];
}

/** `data` payload of `POST /api/user/login` (password stripped, role eager-loaded). */
export interface BackendLoginUser {
  id: number;
  username: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isActive: boolean;
  role: BackendRole | null;
  createdAt: string;
  updatedAt: string;
}

/** `data` payload of `GET /api/user/me` (now returns the same `role` as login). */
export interface BackendMeUser {
  id: number;
  username: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isActive: boolean;
  role: BackendRole | null;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login(username: string, password: string): Promise<BackendLoginUser> {
    return request<BackendLoginUser>("/user/login", {
      method: "POST",
      body: { username, password },
    });
  },
  logout(): Promise<{ message: string }> {
    return request<{ message: string }>("/user/logout", { method: "POST" });
  },
  me(): Promise<BackendMeUser> {
    return request<BackendMeUser>("/user/me");
  },
};
