"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";

export function ForbiddenPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const switchAccount = () => {
    logout();
    router.replace("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="max-w-md p-7 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Icon name="lock" size={24} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink-900">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          This GHN logistics console requires logistics operator or shipping manager
          permission. Switch accounts to continue.
        </p>
        <Button onClick={switchAccount} className="mt-5 w-full">
          Switch account
        </Button>
      </Card>
    </main>
  );
}
