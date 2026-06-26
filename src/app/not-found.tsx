import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="max-w-md p-7 text-center">
        <h1 className="text-xl font-semibold text-ink-900">Shipment not found</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          The order ID does not exist in the local mock shipment data.
        </p>
        <Link href="/shipments">
          <Button className="mt-5">Back to shipments</Button>
        </Link>
      </Card>
    </main>
  );
}
