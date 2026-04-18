import type { VariantProps } from "class-variance-authority";

import { badgeVariants } from "@/components/ui/badge";
import type { PaymentPurpose } from "@/interfaces";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface StatusBadgeConfig {
  label: string;
  variant: BadgeVariant;
  className?: string;
}

export function getSessionStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toUpperCase()) {
    case "DRAFT":
      return {
        label: "Bản nháp",
        variant: "outline",
        className: "border-amber-500 bg-amber-500 text-white hover:bg-amber-500",
      };
    case "SCHEDULED":
      return {
        label: "Đã lên lịch",
        variant: "default",
        className: "bg-yellow-500 text-white hover:bg-yellow-500",
      };
    case "PAID":
      return {
        label: "Đã thanh toán",
        variant: "default",
        className: "bg-emerald-600 text-white hover:bg-emerald-600",
      };
    case "ONGOING":
      return {
        label: "Đang diễn ra",
        variant: "default",
        className: "bg-blue-600 text-white hover:bg-blue-600",
      };
    case "COMPLETED":
      return {
        label: "Hoàn thành",
        variant: "default",
        className: "bg-green-600 text-white hover:bg-green-600",
      };
    case "CANCELED":
      return {
        label: "Đã hủy",
        variant: "default",
        className: "bg-red-600 text-white hover:bg-red-600",
      };
    case "REJECTED":
      return {
        label: "Từ chối",
        variant: "default",
        className: "bg-rose-600 text-white hover:bg-rose-600",
      };
    default:
      return { label: status || "Không rõ", variant: "outline" };
  }
}

export function getPostStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toUpperCase()) {
    case "DRAFT":
      return {
        label: "Bản nháp",
        variant: "outline",
        className: "border-yellow-500 text-yellow-700",
      };
    case "PUBLISHED":
      return {
        label: "Đã xuất bản",
        variant: "outline",
        className: "border-green-500 text-green-700",
      };
    case "ARCHIVED":
      return {
        label: "Đã lưu trữ",
        variant: "outline",
        className: "border-gray-500 text-gray-700",
      };
    default:
      return { label: status || "Không rõ", variant: "outline" };
  }
}

export function getContentStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toLowerCase()) {
    case "pending":
      return { label: "Chờ duyệt", variant: "secondary" };
    case "approved":
      return {
        label: "Đã duyệt",
        variant: "outline",
        className: "border-green-500 text-green-700",
      };
    case "rejected":
      return {
        label: "Từ chối",
        variant: "outline",
        className: "border-red-500 text-red-700",
      };
    default:
      return { label: status || "Không rõ", variant: "outline" };
  }
}

export function getMentorApplicationBadge(isActive: boolean): StatusBadgeConfig {
  return isActive
    ? { label: "Đã duyệt", variant: "default", className: "bg-green-100 text-green-700" }
    : { label: "Chờ duyệt", variant: "outline", className: "border-yellow-500 text-yellow-700" };
}

export function getMockInterviewStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toLowerCase()) {
    case "paid":
      return {
        label: "Đã thanh toán",
        variant: "default",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "ongoing":
      return {
        label: "Đang diễn ra",
        variant: "default",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "upcoming":
    case "scheduled":
      return {
        label: "Sắp diễn ra",
        variant: "default",
        className: "bg-sky-100 text-sky-700",
      };
    default:
      return { label: status || "Không rõ", variant: "outline" };
  }
}

export function getTransactionPurposeBadge(
  purpose?: PaymentPurpose | "UNKNOWN"
): StatusBadgeConfig {
  switch (purpose) {
    case "TOP_UP_WALLET":
      return {
        label: "Nạp ví",
        variant: "default",
        className: "bg-emerald-600 text-white hover:bg-emerald-600",
      };
    case "WITHDRAW_FROM_WALLET":
      return {
        label: "Rút ví",
        variant: "default",
        className: "bg-rose-600 text-white hover:bg-rose-600",
      };
    case "BUY_MEMBERSHIP":
      return {
        label: "Mua gói",
        variant: "default",
        className: "bg-violet-600 text-white hover:bg-violet-600",
      };
    case "MENTOR_INTERVIEW":
      return {
        label: "Phiên mentor",
        variant: "default",
        className: "bg-sky-600 text-white hover:bg-sky-600",
      };
    default:
      return {
        label: "Chưa phân loại",
        variant: "outline",
      };
  }
}
