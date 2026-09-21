import Link from "next/link";
import {
  fmtCodNullable,
  fmtDateTime,
  fmtFeeNullable,
} from "../lib/shipment-formatters";
import type { ShipmentListItem } from "../api/types";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";

/**
 * The shipment grid with no data source of its own.
 *
 * Split out of `ShipmentTable` so the public `/demo` screen can render the real
 * columns against sample rows without duplicating the markup — and without
 * pulling in the query, filters and pagination that only make sense against a
 * live gateway.
 *
 * `getHref` returning `null` renders the order id as plain text, which is how
 * `/demo` keeps its rows from linking into the authenticated console.
 */
export function ShipmentRows({
  items,
  getHref = (item) => `/shipments/${item.orderId}`,
}: {
  items: ShipmentListItem[];
  getHref?: (item: ShipmentListItem) => string | null;
}) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-ink-400">
          <tr>
            <th className="px-5 py-3">Order</th>
            <th className="px-5 py-3">Buyer → Seller</th>
            <th className="px-5 py-3">Local</th>
            <th className="px-5 py-3">GHN</th>
            <th className="px-5 py-3">COD</th>
            <th className="px-5 py-3">Fee</th>
            <th className="px-5 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => {
            const href = getHref(item);
            return (
              <tr key={item.orderId} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  {href ? (
                    <Link
                      href={href}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      #{item.orderId}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink-900">#{item.orderId}</span>
                  )}
                  <p className="mt-1 text-xs text-ink-400">
                    {item.ghnOrderCode ?? "No GHN code"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-ink-900">{item.buyerName}</p>
                  <p className="mt-1 text-xs text-ink-400">{item.sellerName}</p>
                </td>
                <td className="px-5 py-4">
                  <LocalStatusBadge status={item.localStatus} />
                </td>
                <td className="px-5 py-4">
                  <GhnStatusBadge status={item.ghnStatus} raw={item.rawGhnStatus} />
                </td>
                <td className="px-5 py-4 text-ink-700">
                  {fmtCodNullable(item.codAmount)}
                </td>
                <td className="px-5 py-4 text-ink-700">
                  {fmtFeeNullable(item.shippingFee)}
                </td>
                <td className="px-5 py-4 text-xs text-ink-400">
                  {fmtDateTime(item.updatedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
