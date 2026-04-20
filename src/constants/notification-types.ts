import type { LucideIcon } from "lucide-react";
import { Bell, Calendar, CheckCircle, MessageSquare, Star, User, XCircle } from "lucide-react";

export type NotificationType =
  | "INTERVIEW"
  | "FEEDBACK"
  | "REVIEW"
  | "MENTOR"
  | "SUCCESS"
  | "ERROR"
  | "SYSTEM";

interface NotificationTypeConfig {
  type: NotificationType;
  label: string;
  icon: LucideIcon;
  iconColorClassName: string;
  keywords: string[];
}

const NOTIFICATION_TYPE_CONFIGS: NotificationTypeConfig[] = [
  {
    type: "INTERVIEW",
    label: "Phỏng vấn",
    icon: Calendar,
    iconColorClassName: "text-[#0047AB]",
    keywords: ["phỏng vấn", "session", "interview"],
  },
  {
    type: "FEEDBACK",
    label: "Phản hồi",
    icon: MessageSquare,
    iconColorClassName: "text-cyan-500",
    keywords: ["phản hồi", "feedback"],
  },
  {
    type: "REVIEW",
    label: "Đánh giá",
    icon: Star,
    iconColorClassName: "text-yellow-500",
    keywords: ["đánh giá", "review"],
  },
  {
    type: "MENTOR",
    label: "Mentor",
    icon: User,
    iconColorClassName: "text-emerald-600",
    keywords: ["mentor", "duyệt mentor", "học viên"],
  },
  {
    type: "SUCCESS",
    label: "Thành công",
    icon: CheckCircle,
    iconColorClassName: "text-green-500",
    keywords: ["thành công", "success"],
  },
  {
    type: "ERROR",
    label: "Lỗi",
    icon: XCircle,
    iconColorClassName: "text-red-500",
    keywords: ["thất bại", "từ chối", "error", "lỗi"],
  },
  {
    type: "SYSTEM",
    label: "Hệ thống",
    icon: Bell,
    iconColorClassName: "text-slate-500",
    keywords: [],
  },
];

const DEFAULT_NOTIFICATION_TYPE: NotificationType = "SYSTEM";

export const NOTIFICATION_GROUP_ORDER: NotificationType[] = [
  "INTERVIEW",
  "FEEDBACK",
  "REVIEW",
  "MENTOR",
  "SUCCESS",
  "ERROR",
  "SYSTEM",
];

export function inferNotificationType(title?: string): NotificationType {
  const normalizedTitle = title?.trim().toLowerCase() ?? "";
  if (!normalizedTitle) {
    return DEFAULT_NOTIFICATION_TYPE;
  }

  for (const config of NOTIFICATION_TYPE_CONFIGS) {
    if (config.keywords.some((keyword) => normalizedTitle.includes(keyword))) {
      return config.type;
    }
  }

  return DEFAULT_NOTIFICATION_TYPE;
}

export function getNotificationTypeConfig(type: NotificationType): NotificationTypeConfig {
  return (
    NOTIFICATION_TYPE_CONFIGS.find((config) => config.type === type) ??
    NOTIFICATION_TYPE_CONFIGS.find((config) => config.type === DEFAULT_NOTIFICATION_TYPE)!
  );
}

export function getNotificationTypeConfigFromTitle(title?: string): NotificationTypeConfig {
  return getNotificationTypeConfig(inferNotificationType(title));
}
