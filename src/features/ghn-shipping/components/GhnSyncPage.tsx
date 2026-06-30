"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { canSync as roleCanSync, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useShipmentList, useSyncShipment } from "../hooks/useShipments";
import { fmtDateTime } from "../lib/shipment-formatters";
import { rawGhnLabel } from "../lib/shipment-status";
import { syncErrorCopy } from "../lib/sync-errors";
import type { ShipmentListItem } from "../api/types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { GhnStatusBadge } from "./ShipmentStatusBadge";

const SYNC_LIMIT = 50;
const TERMINAL: ReadonlyArray<string> = ["delivered", "returned", "cancelled"];

function isPendingSync(item: ShipmentListItem): boolean {
  return item.canSync && !(item.ghnStatus !== null && TERMINAL.includes(item.ghnStatus));
}

export function GhnSyncPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const { data, isPending, isError, refetch } = useShipmentList({
    page: 1,
    limit: SYNC_LIMIT,
  });
  const sync = useSyncShipment();

  const userMaySync = roleCanSync(user?.role);

  const onSync = (orderId: number) => {
    sync.mutate(orderId, {
      onSuccess: (result) => {
        push({
          kind: "success",
          title: `Order #${orderId} synced`,
          message: `GHN: ${rawGhnLabel(result.ghnStatus)} · now ${result.newStatus}.`,
        });
      },
      onError: (error: unknown) => {
        const copy = syncErrorCopy(error);
        push({
          kind: "error",
          title: `${copy.title} for #${orderId}`,
          message: copy.message,
        });
      },
    });
  };

  const items = data?.items ?? [];
  const syncable = items.filter((item) => item.canSync);
  const pendingCount = items.filter(isPendingSync).length;
  const lastSync = items.reduce<string | null>((latest, item) => {
    if (!item.lastSyncedAt) return latest;
    if (!latest || item.lastSyncedAt > latest) return item.lastSyncedAt;
    return latest;
  }, null);

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-400">GHN sync</p>
        <div className="mt-3 flex items-center gap-2 text-ink-700">
          <Icon name="sync" size={18} className="text-brand-600" />
          <span className="font-semibold">Gateway-backed</span>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          Syncing pulls the latest status from GHN through the backend. Webhooks
          are handled server-side and are not monitored from this console.
        </p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-400">Pending sync</p>
        <p className="mt-3 text-3xl font-semibold text-ink-900">{pendingCount}</p>
        <p className="mt-2 text-sm text-ink-500">
          Orders with a GHN code not yet in a terminal status.
        </p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-400">Last sync</p>
        <p className="mt-3 text-2xl font-semibold text-ink-900">
          {lastSync ? fmtDateTime(lastSync) : "Never"}
        </p>
        <p className="mt-2 text-sm text-ink-500">
          {userMaySync
            ? "Sync individual orders from the list."
            : "Read-only — syncing requires the shipping manager role."}
        </p>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader
          title="Syncable orders"
          subtitle="Orders with a GHN code — sync to refresh status"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void refetch()}
              disabled={isPending}
            >
              <Icon name="refresh" size={15} />
              Refresh
            </Button>
          }
        />
        {isPending ? (
          <div className="p-8 text-center text-sm text-ink-500">Loading orders...</div>
        ) : isError ? (
          <ErrorState
            title="Could not load orders"
            message="The order list failed to load. Try again in a moment."
            onRetry={() => void refetch()}
          />
        ) : syncable.length === 0 ? (
          <EmptyState
            icon="package"
            title="No syncable orders"
            message="Orders need a GHN order code before they can be synced."
          />
        ) : (
          <div className="divide-y divide-line">
            {syncable.map((item) => {
              const busy = sync.isPending && sync.variables === item.orderId;
              return (
                <div
                  key={item.orderId}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/shipments/${item.orderId}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      #{item.orderId}
                    </Link>
                    <p className="mt-1 text-xs text-ink-400">
                      {item.ghnOrderCode} · last synced {fmtDateTime(item.lastSyncedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <GhnStatusBadge status={item.ghnStatus} raw={item.rawGhnStatus} />
                    <Button
                      size="sm"
                      onClick={() => onSync(item.orderId)}
                      disabled={!userMaySync || sync.isPending}
                    >
                      <Icon name="sync" size={15} />
                      {busy ? "Syncing..." : "Sync"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
