"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

export function GhnLoginCard() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter both an email and a password to continue.");
      return;
    }

    setError(null);
    setBusy(true);
    window.setTimeout(() => {
      login(email, password);
      router.replace("/dashboard");
    }, 350);
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
        <Field label="Email or username" htmlFor="email">
          <Input
            id="email"
            autoComplete="username"
            placeholder="mai.logistics@trybuy.demo"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
        Authorized logistics operators only. Demo mode accepts any non-empty
        email and password and stores no real token.
      </p>
    </div>
  );
}
