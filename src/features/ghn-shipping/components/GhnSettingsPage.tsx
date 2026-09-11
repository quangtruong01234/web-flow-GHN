"use client";

import { Card, CardHeader } from "@/components/ui/Card";

/**
 * Read-only integration view.
 *
 * This page used to render fake credentials (`mock-token-not-real`, a made-up
 * shop ID), a "Save settings" button that saved nothing while toasting "saved",
 * and an "Auto sync failed deliveries" toggle that was wired to nothing. The
 * toggle was the dangerous one: GHN-FAIL-NTF-01 makes an automated loop over the
 * sync endpoint notify every buyer whose parcel already failed, so a control
 * whose label invites exactly that must not sit here waiting to be implemented.
 * The console has no GHN settings to write — carrier config is backend-only — so
 * the page states what is true and offers no inputs.
 */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-sm last:border-b-0">
      <span className="text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

function BackendOnly() {
  return <span className="font-normal text-ink-400">Backend-only — never sent here</span>;
}

export function GhnSettingsPage() {
  const gatewayBase = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api";
  const demoMode = process.env.NEXT_PUBLIC_GHN_DEMO_MODE === "true";

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader
          title="GHN integration"
          subtitle="Read-only. This console holds no carrier credentials and has nothing to save."
        />
        <div className="p-5">
          <Row label="Gateway base URL" value={<code className="text-xs">{gatewayBase}</code>} />
          <Row
            label="Console demo mode"
            value={
              demoMode ? (
                <span className="text-amber-700">Enabled (NEXT_PUBLIC_GHN_DEMO_MODE)</span>
              ) : (
                "Disabled"
              )
            }
          />
          <Row label="GHN shop ID" value={<BackendOnly />} />
          <Row label="GHN API token" value={<BackendOnly />} />
          <Row label="Webhook URL" value={<BackendOnly />} />
          <Row label="Webhook secret" value={<BackendOnly />} />
        </div>
      </Card>

      <Card>
        <CardHeader title="How status changes" subtitle="Who is allowed to move a shipment" />
        <div className="space-y-3 p-5 text-sm">
          <p className="text-ink-600">
            GHN status is backend-owned. It changes only through a GHN webhook, an
            operator sync, a supported carrier action, or the demo endpoint.
          </p>
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            There is no auto-sync, and there will not be one. Syncing an order that
            GHN has moved to a failed delivery notifies the buyer, so the console
            syncs one order per explicit click.
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-500">
            The GHN token, shop ID, and webhook secret stay backend-only. This
            console never calls GHN directly.
          </div>
        </div>
      </Card>
    </div>
  );
}
