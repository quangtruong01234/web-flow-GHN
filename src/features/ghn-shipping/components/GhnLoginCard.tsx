"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, Input } from "@/components/ui/Input";
import { isAllowedRole, useAuth } from "@/context/AuthContext";
import { isApiError } from "@/lib/api";

export function GhnLoginCard() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (e.g. landed on /login with a live session) → move along.
  useEffect(() => {
    if (ready && user && isAllowedRole(user.role)) {
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    }
  }, [ready, user, router, searchParams]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Enter both your username and password to continue.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const user = await login(username.trim(), password);
      if (!isAllowedRole(user.role)) {
        router.replace("/403");
        return;
      }
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    } catch (err: unknown) {
      if (isApiError(err)) {
        setError(
          err.status === 401
            ? "Invalid username or password."
            : err.message || "Sign in failed. Please try again.",
        );
      } else {
        setError("Sign in failed. Please try again.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-line bg-white p-7 shadow-card">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Icon name="truck" size={20} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-ink-900">TryBuy Shipping Admin</h1>
          <p className="text-[13px] text-ink-500">GHN logistics operations</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Username" htmlFor="username">
          <Input
            id="username"
            autoComplete="username"
            placeholder="logistics_test"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {error ? (
          <p className="flex items-center gap-1.5 text-[13px] text-red-600">
            <Icon name="warning" size={15} />
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2.5 text-[12px] leading-relaxed text-ink-500">
        Authorized logistics operators and shipping managers only. The session is
        kept in a secure HttpOnly cookie — no token is stored in the browser.
      </p>
    </div>
  );
}
