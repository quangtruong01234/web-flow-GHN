"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { useShipments } from "@/context/ShipmentContext";

export function ActionHistoryPage() {
  const { shipments } = useShipments();
  const rows = shipments.flatMap((shipment) =>
    shipment.history.map((event, index) => ({
      id: `${shipment.orderId}-${index}`,
      orderId: shipment.orderId,
      ...event,
    })),
  );

  return (
    <Card>
      <CardHeader title="Action history" subtitle="Audit trail assembled from mock shipment history" />
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-ink-400">
            <tr>
              <th className="px-5 py-3">Order ID</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Status change</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-medium text-brand-700">{row.orderId}</td>
                <td className="px-5 py-4 text-ink-900">{row.action}</td>
                <td className="px-5 py-4 text-ink-500">{row.old} to {row.nw}</td>
                <td className="px-5 py-4 text-ink-700">{row.actor}</td>
                <td className="px-5 py-4 text-ink-500">{row.time}</td>
                <td className="px-5 py-4">
                  <span className={row.result === "success" ? "text-green-700" : "text-red-600"}>
                    {row.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
