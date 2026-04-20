/**
 * NotificationBell Component
 * Bell icon with unread badge in header
 */

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUnreadCount } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";

import { NotificationDropdown } from "./NotificationDropdown";

interface NotificationBellProps {
  notificationsPath?: string;
  className?: string;
}

export function NotificationBell({ notificationsPath, className }: NotificationBellProps) {
  const { isDropdownOpen, toggleDropdown, closeDropdown } = useNotificationStore();
  const { data: serverUnreadCount } = useUnreadCount();
  const localUnreadCount = useNotificationStore((state) => state.unreadCount);

  // Use server count when available, fall back to local
  const unreadCount = serverUnreadCount ?? localUnreadCount;

  // Format badge count (99+ for counts over 99)
  const badgeText = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <DropdownMenu
      open={isDropdownOpen}
      onOpenChange={(open) => (open ? toggleDropdown() : closeDropdown())}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-9 w-9 rounded-full", className)}>
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white",
                unreadCount > 99 ? "h-5 min-w-5 px-1" : "h-4 min-w-4 px-1"
              )}>
              {badgeText}
            </span>
          )}
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <NotificationDropdown notificationsPath={notificationsPath} />
    </DropdownMenu>
  );
}
