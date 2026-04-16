/**
 * User Notifications Page
 * Full list of notifications for the user
 */

import { Bell, CheckCheck } from "lucide-react";

import { NotificationList } from "@/components/notification";
import { ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useMarkAsRead, useNotifications } from "@/hooks/useNotification";
import { useNotificationStore } from "@/stores/notificationStore";

export function UserNotificationsPage() {
  const { data: notifications = [], isLoading, isRefetching, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    // Mark all as read locally first for instant feedback
    markAllAsRead();
    // Then mark each unread notification on server
    notifications
      .filter((n) => !n.isRead && n.id)
      .forEach((n) => {
        if (n.id) markAsRead(n.id);
      });
  };

  const handleMarkRead = (notificationId: number) => {
    markAsRead(notificationId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông Báo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý tất cả thông báo của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={async () => {
              await refetch();
            }}
            isLoading={isRefetching}
            tooltip="Tải lại thông báo"
          />
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng thông báo</CardDescription>
            <CardTitle className="text-2xl">{notifications.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chưa đọc</CardDescription>
            <CardTitle className="text-2xl text-[#0047AB]">{unreadCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã đọc</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {notifications.length - unreadCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#0047AB]" />
            <CardTitle>Danh Sách Thông Báo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onMarkRead={handleMarkRead}
              emptyMessage="Bạn chưa có thông báo nào"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
