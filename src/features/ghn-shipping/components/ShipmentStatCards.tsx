import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { fmtVND } from "../lib/shipment-formatters";
import type { Shipment } from "../types";

export function ShipmentStatCards({ shipments }: { shipments: Shipment[] }) {
  const failed = shipments.filter((shipment) => shipment.ghnStatus === "delivery_fail").length;
  const inTransit = shipments.filter((shipment) =>
    ["picking", "delivering"].includes(shipment.ghnStatus),
  ).length;
  const ready = shipments.filter((shipment) => shipment.ghnStatus === "ready_to_pick").length;
  const pendingCod = shipments.reduce(
    (sum, shipment) => sum + (shipment.payment.status === "unpaid" ? shipment.codAmount : 0),
    0,
  );

  const stats: Array<{ label: string; value: string; hint: string; icon: IconName }> = [
    { label: "Active shipments", value: String(inTransit + ready), hint: `${inTransit} in transit, ${ready} waiting`, icon: "truck" },
    { label: "Failed deliveries", value: String(failed), hint: "Needs operator review", icon: "warning" },
    { label: "Pending COD", value: fmtVND(pendingCod), hint: "Mock collection total", icon: "wallet" },
    { label: "Last sync", value: "2 min ago", hint: "Webhook connected in demo", icon: "sync" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-ink-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{stat.value}</p>
              <p className="mt-1 text-xs text-ink-500">{stat.hint}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name={stat.icon} size={18} />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
