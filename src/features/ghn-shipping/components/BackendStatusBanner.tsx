"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useGatewayHealth } from "@/hooks/useGatewayHealth";

/**
 * Site-wide notice shown when the TryBuy gateway does not answer.
 *
 * The backend runs on a cost-capped schedule, so "nothing loads" is the normal
 * state outside that window — not a broken build. Without this strip the app
 * looks dead: the login form rejects every attempt and each console screen sits
 * on a generic retry state, none of which say why.
 *
 * It never blocks the UI (no overlay, no modal) and never renders while the
 * probe is still `unknown`, so a slow first probe cannot flash a false alarm.
 *
 * Kept out of the sticky layer on purpose: `GhnAdminShell` already sticks its
 * sidebar and topbar at `top-0`, and a second sticky strip would overlap them.
 */
export function BackendStatusBanner() {
  const { isOffline } = useGatewayHealth();

  if (!isOffline) return null;

  const guideUrl = process.env.NEXT_PUBLIC_DEMO_GUIDE_URL?.trim();

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-900"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1.5 text-xs leading-5">
        <Icon name="info" size={15} className="text-amber-700" />
        <p className="min-w-0">
          Backend is scheduled to run 14:00–19:00 ICT (UTC+7) to keep hosting
          cost near zero. Browse the read-only sample console.
        </p>
        <span className="flex flex-wrap items-center gap-3 font-semibold">
          <Link href="/demo" className="underline underline-offset-2">
            Sample console
          </Link>
          {guideUrl ? (
            <a
              href={guideUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Demo guide
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
}
