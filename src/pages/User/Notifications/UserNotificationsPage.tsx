import { useTranslation } from "react-i18next";
/**
 * User Notifications Page
 * Full list of notifications for the user
 */

import { NotificationDetailModal, NotificationList } from "@/components/notification";
import { ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getNotificationTypeConfig,
  inferNotificationType,
  NOTIFICATION_GROUP_ORDER,
} from "@/constants/notification-types";
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from "@/hooks/useNotification";
import type { Notification } from "@/services/notification.manager";
import { Bell, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";
type NotificationFilter = "all" | "unread" | "read";
export function UserNotificationsPage() {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<NotificationFilter>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { data: notifications = [], isLoading, isRefetching, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.length - unreadCount;
  const unreadNotificationIds = useMemo(
    () =>
      notifications.filter((n) => !n.isRead && typeof n.id === "number").map((n) => n.id as number),
    [notifications]
  );
  const filteredNotifications = useMemo(() => {
    if (filterStatus === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }
    if (filterStatus === "read") {
      return notifications.filter((notification) => notification.isRead);
    }
    return notifications;
  }, [filterStatus, notifications]);
  const groupedNotifications = useMemo(() => {
    const groupedMap = new Map<string, Notification[]>();
    for (const notification of filteredNotifications) {
      const type = inferNotificationType(notification.title, t);
      const currentGroup = groupedMap.get(type) ?? [];
      currentGroup.push(notification);
      groupedMap.set(type, currentGroup);
    }
    return NOTIFICATION_GROUP_ORDER.map((type) => ({
      type,
      label: getNotificationTypeConfig(type, t).label,
      notifications: groupedMap.get(type) ?? [],
    })).filter((group) => group.notifications.length > 0);
  }, [filteredNotifications, t]);
  const handleMarkAllRead = () => {
    if (!unreadNotificationIds.length) {
      return;
    }
    markAllAsRead(unreadNotificationIds);
  };
  const handleMarkRead = (notificationId: number) => {
    markAsRead(notificationId);
  };
  const handleItemClick = (notification: Notification) => {
    setSelectedNotification(
      notification.isRead
        ? notification
        : {
            ...notification,
            isRead: true,
          }
    );
  };
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t("common.notification")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("common.manageAllYourNotifications")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReloadButton
              onReload={async () => {
                await refetch();
              }}
              isLoading={isRefetching}
              tooltip={t("common.reloadNotifications")}
            />
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllAsRead}
                className="gap-2">
                {isMarkingAllAsRead ? <Spinner size="sm" /> : <CheckCheck className="h-4 w-4" />}
                {t("common.markAllAsRead")}
              </Button>
            )}
          </div>
        </div>

        <Tabs
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as NotificationFilter)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="all">
              {t("common.all")}
              {notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              {t("general.unread")}
              {unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              {t("general.read")}
              {readCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("common.generalAnnouncement")}</CardDescription>
              <CardTitle className="text-2xl">{notifications.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("common.haventReadYet")}</CardDescription>
              <CardTitle className="text-2xl text-[#0047AB]">{unreadCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("common.read")}</CardDescription>
              <CardTitle className="text-2xl text-green-600">{readCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#0047AB]" />
              <CardTitle>{t("common.notificationList")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : groupedNotifications.length === 0 ? (
              <NotificationList
                notifications={[]}
                isLoading={isLoading}
                emptyMessage={t("common.noMessagesMatchingTheFilterWereFou")}
              />
            ) : (
              <div className="space-y-6">
                {groupedNotifications.map((group) => (
                  <section key={group.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {group.label}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {group.notifications.length} {t("common.notification1")}
                      </span>
                    </div>
                    <NotificationList
                      notifications={group.notifications}
                      isLoading={isLoading}
                      onItemClick={handleItemClick}
                      onMarkRead={handleMarkRead}
                    />
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
