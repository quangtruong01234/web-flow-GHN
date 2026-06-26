import { Icon, type IconName } from "@/components/ui/Icon";

export function EmptyState({
  icon = "box",
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-ink-400">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        {message ? <p className="mt-1 text-sm text-ink-500">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}
