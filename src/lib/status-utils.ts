import { badgeVariants } from "@/components/ui/badge";
import type { PaymentPurpose } from "@/interfaces";
import i18n from "@/lib/i18n";
import type { VariantProps } from "class-variance-authority";
const t = i18n.t.bind(i18n);
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
        label: t("common.draft"),
        variant: "outline",
        className: "border-amber-500 bg-amber-500 text-white hover:bg-amber-500",
      };
    case "SCHEDULED":
      return {
        label: t("common.scheduled"),
        variant: "default",
        className: "bg-yellow-500 text-white hover:bg-yellow-500",
      };
    case "PAID":
      return {
        label: t("common.paid"),
        variant: "default",
        className: "bg-emerald-600 text-white hover:bg-emerald-600",
      };
    case "ONGOING":
      return {
        label: t("common.ongoing"),
        variant: "default",
        className: "bg-blue-600 text-white hover:bg-blue-600",
      };
    case "COMPLETED":
      return {
        label: t("general.completed"),
        variant: "default",
        className: "bg-green-600 text-white hover:bg-green-600",
      };
    case "CANCELED":
      return {
        label: t("common.canceled"),
        variant: "default",
        className: "bg-red-600 text-white hover:bg-red-600",
      };
    case "REJECTED":
      return {
        label: t("common.refuse"),
        variant: "default",
        className: "bg-rose-600 text-white hover:bg-rose-600",
      };
    default:
      return {
        label: status || t("general.hollow"),
        variant: "outline",
      };
  }
}
export function getPostStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toUpperCase()) {
    case "DRAFT":
      return {
        label: t("common.draft"),
        variant: "outline",
        className: "border-yellow-500 text-yellow-700",
      };
    case "PUBLISHED":
      return {
        label: t("common.published"),
        variant: "outline",
        className: "border-green-500 text-green-700",
      };
    case "ARCHIVED":
      return {
        label: t("common.archived"),
        variant: "outline",
        className: "border-gray-500 text-gray-700",
      };
    default:
      return {
        label: status || t("general.hollow"),
        variant: "outline",
      };
  }
}
export function getContentStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toLowerCase()) {
    case "pending":
      return {
        label: t("common.waitingForApproval"),
        variant: "secondary",
      };
    case "approved":
      return {
        label: t("common.approved"),
        variant: "outline",
        className: "border-green-500 text-green-700",
      };
    case "rejected":
      return {
        label: t("common.refuse"),
        variant: "outline",
        className: "border-red-500 text-red-700",
      };
    default:
      return {
        label: status || t("general.hollow"),
        variant: "outline",
      };
  }
}
export function getMentorApplicationBadge(isActive: boolean): StatusBadgeConfig {
  return isActive
    ? {
        label: t("common.approved"),
        variant: "default",
        className: "bg-green-100 text-green-700",
      }
    : {
        label: t("common.waitingForApproval"),
        variant: "outline",
        className: "border-yellow-500 text-yellow-700",
      };
}
export function getMockInterviewStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toLowerCase()) {
    case "paid":
      return {
        label: t("common.paid"),
        variant: "default",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "ongoing":
      return {
        label: t("common.ongoing"),
        variant: "default",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "upcoming":
    case "scheduled":
      return {
        label: t("common.comingSoon"),
        variant: "default",
        className: "bg-sky-100 text-sky-700",
      };
    default:
      return {
        label: status || t("general.hollow"),
        variant: "outline",
      };
  }
}
export function getTransactionPurposeBadge(
  purpose?: PaymentPurpose | "UNKNOWN"
): StatusBadgeConfig {
  switch (purpose) {
    case "TOP_UP_WALLET":
      return {
        label: t("common.topUpYourWallet"),
        variant: "default",
        className: "bg-emerald-600 text-white hover:bg-emerald-600",
      };
    case "WITHDRAW_FROM_WALLET":
      return {
        label: t("common.takeOutYourWallet"),
        variant: "default",
        className: "bg-rose-600 text-white hover:bg-rose-600",
      };
    case "BUY_MEMBERSHIP":
      return {
        label: t("common.buyPackages"),
        variant: "default",
        className: "bg-violet-600 text-white hover:bg-violet-600",
      };
    case "MENTOR_INTERVIEW":
      return {
        label: t("general.mentorSession"),
        variant: "default",
        className: "bg-sky-600 text-white hover:bg-sky-600",
      };
    default:
      return {
        label: t("common.uncategorized"),
        variant: "outline",
      };
  }
}
export function getJobDescriptionStatusBadge(status?: string): StatusBadgeConfig {
  switch (status?.toUpperCase()) {
    case "OPEN":
      return {
        label: t("general.open"),
        variant: "default",
        className: "bg-emerald-600 text-white hover:bg-emerald-600",
      };
    case "CLOSED":
      return {
        label: t("enterpriseJobdescriptiondetailpage.closed"),
        variant: "default",
        className: "bg-red-600 text-white hover:bg-red-600",
      };
    case "DRAFT":
      return {
        label: t("common.draft1"),
        variant: "outline",
        className: "border-amber-500 bg-amber-500 text-white hover:bg-amber-500",
      };
    default:
      return {
        label: status || t("general.hollow"),
        variant: "outline",
      };
  }
}
export function getJobDescriptionLevelBadge(level?: string): StatusBadgeConfig {
  switch (level?.toUpperCase()) {
    case "INTERN":
      return {
        label: "Intern",
        variant: "default",
        className: "bg-gray-500 text-white hover:bg-gray-500",
      };
    case "FRESHER":
      return {
        label: "Fresher",
        variant: "default",
        className: "bg-green-500 text-white hover:bg-green-500",
      };
    case "JUNIOR":
      return {
        label: "Junior",
        variant: "default",
        className: "bg-blue-500 text-white hover:bg-blue-500",
      };
    case "MIDDLE":
      return {
        label: "Middle",
        variant: "default",
        className: "bg-purple-600 text-white hover:bg-purple-600",
      };
    default:
      return {
        label: level || t("general.hollow"),
        variant: "outline",
      };
  }
}
