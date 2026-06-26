import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function ErrorState({
  title = "Something went wrong",
  message = "We could not load this data. Try again in a moment.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Icon name="error" size={22} />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-sm text-ink-500">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
