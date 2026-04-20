import { CalendarClock, CheckCircle2, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, parseBackendDate } from "@/lib/formatting";
import type { Notification } from "@/services/notification.manager";

interface NotificationDetailModalProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailModal({
  notification,
  open,
  onOpenChange,
}: NotificationDetailModalProps) {
  if (!notification) {
    return null;
  }

  const parsedCreatedAt = parseBackendDate(notification.createAt);
  const isRead = Boolean(notification.isRead);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{notification.title || "Thông báo"}</DialogTitle>
          <DialogDescription>Xem chi tiết thông báo của bạn</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                isRead
                  ? "border-emerald-200 text-emerald-700"
                  : "border-[#0047AB]/40 text-[#0047AB]"
              }>
              {isRead ? (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Circle className="mr-1 h-3.5 w-3.5 fill-current" />
              )}
              {isRead ? "Đã đọc" : "Chưa đọc"}
            </Badge>

            {parsedCreatedAt && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDateTime(parsedCreatedAt)}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {notification.message || "Thông báo này chưa có nội dung chi tiết."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
