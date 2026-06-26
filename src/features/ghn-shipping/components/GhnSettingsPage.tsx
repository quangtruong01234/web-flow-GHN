"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";

export function GhnSettingsPage() {
  const { push } = useToast();
  const [autoSync, setAutoSync] = useState(true);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="GHN integration" subtitle="Form UI only. Secrets are masked and not saved." />
        <div className="space-y-4 p-5">
          <Field label="Shop ID"><Input value="******2481" readOnly /></Field>
          <Field label="GHN API token"><Input type="password" value="mock-token-not-real" readOnly /></Field>
          <Field label="Webhook URL"><Input value="https://api.trybuy.local/api/ghn/webhook" readOnly /></Field>
          <Field label="Webhook secret"><Input type="password" value="mock-secret-not-real" readOnly /></Field>
          <label className="flex items-center justify-between rounded-lg border border-line px-3 py-3 text-sm">
            <span>
              <span className="block font-medium text-ink-900">Auto sync failed deliveries</span>
              <span className="text-xs text-ink-400">Mock toggle for UI validation.</span>
            </span>
            <input type="checkbox" checked={autoSync} onChange={(event) => setAutoSync(event.target.checked)} />
          </label>
          <Button
            onClick={() =>
              push({
                kind: "success",
                title: "Settings saved locally",
                message: "No real GHN credentials or secrets were stored.",
              })
            }
          >
            Save settings
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Connection status" subtitle="Demo-only indicators" />
        <div className="space-y-3 p-5 text-sm">
          <div className="rounded-lg bg-green-50 px-3 py-2 font-medium text-green-700">Webhook URL reachable (mock)</div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-ink-500">Last token check: not performed in UI phase</div>
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">GHN token and shop_id must remain backend-only.</div>
        </div>
      </Card>
    </div>
  );
}
