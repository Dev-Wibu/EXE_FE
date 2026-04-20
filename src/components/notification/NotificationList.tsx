/**
 * NotificationList Component
 * Displays a list of notifications with loading and empty states
 */

import { Bell } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Notification } from "@/services/notification.manager";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onItemClick?: (notification: Notification) => void;
  onMarkRead?: (notificationId: number) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  compact?: boolean;
  maxItems?: number;
  emptyMessage?: string;
  className?: string;
}

export function NotificationList({
  notifications,
  isLoading,
  onItemClick,
  onMarkRead,
  hasMore,
  onLoadMore,
  compact = false,
  maxItems,
  emptyMessage = "Không có thông báo nào",
  className,
}: NotificationListProps) {
  // Apply maxItems limit if specified
  const displayedNotifications = maxItems ? notifications.slice(0, maxItems) : notifications;

  // Loading state
  if (isLoading && notifications.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Bell className="h-8 w-8 text-slate-400" />
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Notification items */}
      <div role="list" className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        {displayedNotifications.map((notification, index) => (
          <div key={`${notification.id ?? "notification"}-${index}`} role="listitem">
            <NotificationItem
              notification={notification}
              onClick={() => onItemClick?.(notification)}
              onMarkRead={() => notification.id && onMarkRead?.(notification.id)}
              compact={compact}
            />
          </div>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-[#0047AB] transition-colors hover:bg-[#0047AB]/5 disabled:opacity-50 dark:text-[#66B2FF] dark:hover:bg-[#0047AB]/10">
          {isLoading ? <Spinner size="sm" aria-label="Đang tải thêm thông báo" /> : "Xem thêm"}
        </button>
      )}

      {/* Loading more indicator */}
      {isLoading && notifications.length > 0 && (
        <div className="flex items-center justify-center py-2">
          <Spinner size="md" />
        </div>
      )}
    </div>
  );
}
