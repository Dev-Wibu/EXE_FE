import { useTranslation } from "react-i18next";
/**
 * NotificationItem Component
 * Displays a single notification with icon, title, message, and time
 */

import { getNotificationTypeConfigFromTitle } from "@/constants/notification-types";
import { formatDateTime, parseBackendDate } from "@/lib/formatting";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Notification } from "@/services/notification.manager";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onMarkRead?: () => void;
  compact?: boolean;
}
export function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  compact = false,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const notificationType = getNotificationTypeConfigFromTitle(notification.title, t);
  const isUnread = !notification.isRead;
  const parsedCreatedAt = parseBackendDate(notification.createAt);
  const notificationTitle = notification.title || t("common.notification");
  const handleClick = () => {
    if (onMarkRead && isUnread) {
      onMarkRead();
    }
    onClick?.();
  };
  const timeAgo = parsedCreatedAt
    ? formatDistanceToNow(parsedCreatedAt, {
        addSuffix: true,
        locale: i18n.language === "en" ? undefined : vi,
      })
    : "";
  const absoluteTime = parsedCreatedAt ? formatDateTime(parsedCreatedAt) : "";
  const IconComponent = notificationType.icon;
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("general.openNotification", {
        var_0: notificationTitle,
      })}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-colors",
        isUnread
          ? "bg-[#0047AB]/5 hover:bg-[#0047AB]/10 dark:bg-[#0047AB]/10 dark:hover:bg-[#0047AB]/20"
          : "hover:bg-slate-50 dark:hover:bg-slate-800",
        compact && "p-2"
      )}>
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-[#0047AB]/10 dark:bg-[#0047AB]/20" : "bg-slate-100 dark:bg-slate-800",
          compact && "h-8 w-8"
        )}>
        <IconComponent
          className={cn("h-5 w-5", notificationType.iconColorClassName, compact && "h-4 w-4")}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium text-slate-900 dark:text-slate-100",
              isUnread && "font-semibold"
            )}>
            {notificationTitle}
          </p>
          {/* Unread indicator */}
          {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0047AB]" />}
        </div>
        <p
          className={cn(
            "mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400",
            compact && "line-clamp-1"
          )}>
          {notification.message}
        </p>
        {timeAgo && (
          <p title={absoluteTime} className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {timeAgo}
          </p>
        )}
      </div>
    </button>
  );
}
