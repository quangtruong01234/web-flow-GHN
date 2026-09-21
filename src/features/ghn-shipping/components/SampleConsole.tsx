"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import {
  SAMPLE_HISTORY,
  SAMPLE_SHIPMENTS,
  SAMPLE_TOTAL,
} from "../data/sample-shipments";
import { ShipmentRows } from "./ShipmentRows";
import { ShipmentStatCards } from "./ShipmentStatCards";
import { ShipmentTimeline } from "./ShipmentTimeline";

/**
 * Public, read-only walkthrough of the console, rendered from static sample data.
 *
 * It exists for the window when the gateway is not running: the real screens are
 * all behind `AuthGate`, and with the backend down a visitor cannot even log in,
 * so every authenticated route would show a login redirect instead of the work.
 *
 * Everything here is inert by design — no queries, no mutations, no links into
 * the authenticated console, and no action controls. The sample rows never touch
 * the React Query cache, so nothing on a live screen can pick up a status the
 * backend did not report (`.ai/context/domain.md`).
 */
export function SampleConsole() {
  const [selectedId, setSelectedId] = useState(SAMPLE_SHIPMENTS[0].orderId);
  const selected =
    SAMPLE_SHIPMENTS.find((item) => item.orderId === selectedId) ??
    SAMPLE_SHIPMENTS[0];
  const history = SAMPLE_HISTORY[selected.orderId] ?? [];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name="truck" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                TryBuy GHN Console
              </p>
              <p className="text-xs text-ink-400">Sample console · no sign-in</p>
            </div>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Go to sign in →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-5 py-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Sample data — nothing here is live.</p>
          <p className="mt-1">
            These rows are static fixtures, not orders. The real console reads
            every figure from the TryBuy gateway and can sync or action a
            shipment; this page does neither, so no carrier call and no buyer
            notification can originate from it.
          </p>
        </div>

        <ShipmentStatCards items={SAMPLE_SHIPMENTS} total={SAMPLE_TOTAL} />

        <Card>
          <CardHeader
            title="Shipments"
            subtitle="Six sample orders covering the states an operator works daily"
          />
          <ShipmentRows items={SAMPLE_SHIPMENTS} getHref={() => null} />
        </Card>

        <Card>
          <CardHeader
            title="Shipping history"
            subtitle="Every status change the backend recorded, newest first"
          />
          <div className="flex flex-wrap gap-2 border-b border-line px-5 py-4">
            {SAMPLE_SHIPMENTS.map((item) => (
              <button
                key={item.orderId}
                type="button"
                onClick={() => setSelectedId(item.orderId)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  item.orderId === selected.orderId
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-line bg-white text-ink-600 hover:bg-slate-50",
                )}
              >
                #{item.orderId}
              </button>
            ))}
          </div>
          <div className="p-5">
            <ShipmentTimeline history={history} />
          </div>
        </Card>

        <p className="pb-4 text-xs leading-5 text-ink-500">
          Want the live console? Sign in during the backend window — the banner on
          every page names the hours.
        </p>
      </main>
    </div>
  );
}
