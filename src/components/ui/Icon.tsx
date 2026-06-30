import {
  AlertTriangle,
  Bell,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleX,
  CornerUpLeft,
  History,
  Info,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Truck,
  User,
  Wallet,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type IconName =
  | "dashboard"
  | "package"
  | "sync"
  | "history"
  | "settings"
  | "logout"
  | "search"
  | "refresh"
  | "filter"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "check"
  | "warning"
  | "info"
  | "error"
  | "truck"
  | "wallet"
  | "user"
  | "phone"
  | "mapPin"
  | "box"
  | "bolt"
  | "lock"
  | "rotateLeft"
  | "cornerUpLeft"
  | "bell"
  | "shield";

const ICONS: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  package: Package,
  sync: RefreshCw,
  history: History,
  settings: Settings,
  logout: LogOut,
  search: Search,
  refresh: RefreshCw,
  filter: SlidersHorizontal,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
  check: Check,
  warning: AlertTriangle,
  info: Info,
  error: CircleX,
  truck: Truck,
  wallet: Wallet,
  user: User,
  phone: Phone,
  mapPin: MapPin,
  box: Box,
  bolt: Zap,
  lock: Lock,
  rotateLeft: RotateCcw,
  cornerUpLeft: CornerUpLeft,
  bell: Bell,
  shield: Shield,
};

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
}

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.8,
  ...rest
}: IconProps) {
  const Component = ICONS[name];
  return (
    <Component
      aria-hidden="true"
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...rest}
    />
  );
}
