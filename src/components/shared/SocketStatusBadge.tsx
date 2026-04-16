import { cn } from "@/lib/utils";
import { CheckCircle2, WifiOff } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

export type SocketConnectionState = "connecting" | "connected" | "disconnected";

interface SocketStatusBadgeProps {
  state: SocketConnectionState;
}

const STATE_CONFIG: Record<
  SocketConnectionState,
  {
    label: string;
    className: string;
    Icon?: typeof CheckCircle2;
  }
> = {
  connecting: {
    label: "Đang kết nối",
    className: "text-amber-600 dark:text-amber-400",
  },
  connected: {
    label: "Kết nối ổn định",
    className: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  disconnected: {
    label: "Mất kết nối",
    className: "text-red-600 dark:text-red-400",
    Icon: WifiOff,
  },
};

export function SocketStatusBadge({ state }: SocketStatusBadgeProps) {
  const { label, className, Icon } = STATE_CONFIG[state];

  return (
    <p className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      {state === "connecting" ? (
        <Spinner size="xs" className="[--orbit-spinner-color:currentColor]" />
      ) : (
        Icon && <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </p>
  );
}
