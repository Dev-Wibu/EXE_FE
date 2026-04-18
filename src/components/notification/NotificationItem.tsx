/**
 * NotificationItem Component
 * Displays a single notification with icon, title, message, and time
 */

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, Calendar, CheckCircle, MessageSquare, Star, User, XCircle } from "lucide-react";

import { formatDateTime, parseBackendDate } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import type { Notification } from "@/services/notification.manager";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onMarkRead?: () => void;
  compact?: boolean;
}

// Get icon based on notification title/type
const getNotificationIcon = (title?: string) => {
  const lowerTitle = title?.toLowerCase() || "";

  if (lowerTitle.includes("phỏng vấn") || lowerTitle.includes("session")) {
    return Calendar;
  }
  if (lowerTitle.includes("phản hồi") || lowerTitle.includes("feedback")) {
    return MessageSquare;
  }
  if (lowerTitle.includes("đánh giá") || lowerTitle.includes("review")) {
    return Star;
  }
  if (lowerTitle.includes("mentor") || lowerTitle.includes("duyệt")) {
    return User;
  }
  if (lowerTitle.includes("thành công") || lowerTitle.includes("success")) {
    return CheckCircle;
  }
  if (lowerTitle.includes("thất bại") || lowerTitle.includes("từ chối")) {
    return XCircle;
  }
  return Bell;
};

// Get icon color based on notification type
const getIconColor = (title?: string) => {
  const lowerTitle = title?.toLowerCase() || "";

  if (
    lowerTitle.includes("thành công") ||
    lowerTitle.includes("success") ||
    lowerTitle.includes("duyệt")
  ) {
    return "text-green-500";
  }
  if (lowerTitle.includes("thất bại") || lowerTitle.includes("từ chối")) {
    return "text-red-500";
  }
  if (lowerTitle.includes("đánh giá") || lowerTitle.includes("review")) {
    return "text-yellow-500";
  }
  return "text-[#0047AB]";
};

export function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  compact = false,
}: NotificationItemProps) {
  const iconColor = getIconColor(notification.title);
  const isUnread = !notification.isRead;
  const parsedCreatedAt = parseBackendDate(notification.createAt);

  const handleClick = () => {
    if (onMarkRead && isUnread) {
      onMarkRead();
    }
    onClick?.();
  };

  const timeAgo = parsedCreatedAt
    ? formatDistanceToNow(parsedCreatedAt, {
        addSuffix: true,
        locale: vi,
      })
    : "";

  const absoluteTime = parsedCreatedAt ? formatDateTime(parsedCreatedAt) : "";

  // Helper function to render the appropriate icon
  const renderIcon = () => {
    const IconComponent = getNotificationIcon(notification.title);
    return <IconComponent className={cn("h-5 w-5", iconColor, compact && "h-4 w-4")} />;
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors",
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
        {renderIcon()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium text-slate-900 dark:text-slate-100",
              isUnread && "font-semibold"
            )}>
            {notification.title || "Thông báo"}
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
    </div>
  );
}
