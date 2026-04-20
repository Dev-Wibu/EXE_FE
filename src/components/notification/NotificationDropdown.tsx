/**
 * NotificationDropdown Component
 * Dropdown showing recent notifications with quick actions
 */

import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DropdownMenuContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from "@/hooks/useNotification";
import type { Notification } from "@/services/notification.manager";
import { useNotificationStore } from "@/stores/notificationStore";

import { NotificationDetailModal } from "./NotificationDetailModal";
import { NotificationList } from "./NotificationList";

interface NotificationDropdownProps {
  notificationsPath?: string;
}

export function NotificationDropdown({
  notificationsPath = "/dashboard/notifications",
}: NotificationDropdownProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { data: notifications = [], isLoading } = useNotifications();
  const closeDropdown = useNotificationStore((state) => state.closeDropdown);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();

  // Get recent notifications (max 5)
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadNotificationIds = notifications
    .filter((n) => !n.isRead && typeof n.id === "number")
    .map((n) => n.id as number);

  const handleMarkAllRead = () => {
    if (!unreadNotificationIds.length) {
      return;
    }

    markAllAsRead(unreadNotificationIds);
  };

  const handleItemClick = (notification: Notification) => {
    setSelectedNotification(notification.isRead ? notification : { ...notification, isRead: true });
    closeDropdown();
  };

  const handleMarkRead = (notificationId: number) => {
    markAsRead(notificationId);
  };

  return (
    <>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1rem)] p-0 sm:w-96">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllAsRead}
              className="h-auto px-2 py-1 text-xs text-[#0047AB] hover:text-[#0047AB] dark:text-[#66B2FF]">
              {isMarkingAllAsRead ? (
                <Spinner size="sm" className="mr-1" aria-label="Đang đánh dấu thông báo" />
              ) : (
                <CheckCheck className="mr-1 h-3 w-3" />
              )}
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          <NotificationList
            notifications={recentNotifications}
            isLoading={isLoading}
            onItemClick={handleItemClick}
            onMarkRead={handleMarkRead}
            compact
            emptyMessage="Không có thông báo mới"
          />
        </ScrollArea>

        {/* Footer */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link
            to={notificationsPath}
            onClick={closeDropdown}
            className="flex w-full items-center justify-center rounded-md py-2 text-sm font-medium text-[#0047AB] transition-colors hover:bg-[#0047AB]/5 dark:text-[#66B2FF] dark:hover:bg-[#0047AB]/10">
            Xem tất cả thông báo
          </Link>
        </div>
      </DropdownMenuContent>

      <NotificationDetailModal
        notification={selectedNotification}
        open={Boolean(selectedNotification)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null);
          }
        }}
      />
    </>
  );
}
