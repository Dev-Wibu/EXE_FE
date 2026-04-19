export type DashboardRole = "user" | "mentor";

export interface DashboardTabDefinition {
  type: string;
  label: string;
}

export interface DashboardBreadcrumbItem {
  label: string;
  href?: string;
}

interface RoleConfig {
  rootPath: string;
  rootLabel: string;
  defaultTab: string;
}

interface RouteLabelRule {
  pattern: RegExp;
  label: string;
}

const ROLE_CONFIG: Record<DashboardRole, RoleConfig> = {
  user: {
    rootPath: "/user",
    rootLabel: "Người dùng",
    defaultTab: "homeFeed",
  },
  mentor: {
    rootPath: "/mentor",
    rootLabel: "Mentor",
    defaultTab: "overview",
  },
};

const USER_ROUTE_LABEL_RULES: RouteLabelRule[] = [
  { pattern: /^\/user\/ai-interview\/setup$/, label: "Thiết lập" },
  { pattern: /^\/user\/ai-interview\/session$/, label: "Phiên phỏng vấn" },
  { pattern: /^\/user\/ai-interview\/result\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/user\/mock-interview\/select-mentor$/, label: "Chọn mentor" },
  { pattern: /^\/user\/mock-interview\/schedule$/, label: "Lên lịch" },
  { pattern: /^\/user\/mock-interview\/booking-success$/, label: "Đặt lịch thành công" },
  { pattern: /^\/user\/mock-interview\/room\/[^/]+$/, label: "Phòng phỏng vấn" },
  { pattern: /^\/user\/mock-interview\/history\/[^/]+\/feedback$/, label: "Viết đánh giá" },
  { pattern: /^\/user\/mock-interview\/history\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/user\/practice\/[^/]+\/quiz\/[^/]+\/result$/, label: "Kết quả" },
  { pattern: /^\/user\/practice\/[^/]+\/quiz\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/user\/practice\/session\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/user\/practice\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/user\/feedback\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/user\/mentors\/[^/]+$/, label: "Chi tiết" },
];

const MENTOR_ROUTE_LABEL_RULES: RouteLabelRule[] = [
  { pattern: /^\/mentor\/sessions\/room\/[^/]+$/, label: "Phòng phỏng vấn" },
  { pattern: /^\/mentor\/sessions\/[^/]+\/review$/, label: "Viết phản hồi" },
  { pattern: /^\/mentor\/sessions\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/mentor\/reviews\/[^/]+$/, label: "Chi tiết" },
  { pattern: /^\/mentor\/students\/[^/]+$/, label: "Chi tiết" },
];

function normalizePath(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getTabLabel(tabType: string, availableTabs: DashboardTabDefinition[]): string {
  const matchedTab = availableTabs.find((tab) => tab.type === tabType);
  return matchedTab?.label ?? "Trang";
}

function getRouteRules(role: DashboardRole): RouteLabelRule[] {
  return role === "user" ? USER_ROUTE_LABEL_RULES : MENTOR_ROUTE_LABEL_RULES;
}

function isDynamicSegment(segment: string): boolean {
  if (!segment) {
    return false;
  }

  if (/^\d+$/.test(segment)) {
    return true;
  }

  return /^[a-f0-9-]{8,}$/i.test(segment);
}

function toReadableLabel(segment: string): string {
  if (!segment) {
    return "Chi tiết";
  }

  if (isDynamicSegment(segment)) {
    return "Chi tiết";
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getNestedRouteLabel(role: DashboardRole, pathname: string): string {
  const normalizedPath = normalizePath(pathname);
  const matchedRule = getRouteRules(role).find((rule) => rule.pattern.test(normalizedPath));
  if (matchedRule) {
    return matchedRule.label;
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);
  return toReadableLabel(lastSegment ?? "");
}

export function buildDashboardBreadcrumbItems({
  role,
  pathname,
  activeTab,
  availableTabs,
}: {
  role: DashboardRole;
  pathname: string;
  activeTab: string;
  availableTabs: DashboardTabDefinition[];
}): DashboardBreadcrumbItem[] {
  const roleConfig = ROLE_CONFIG[role];
  const normalizedPath = normalizePath(pathname);
  const activeTabLabel = getTabLabel(activeTab, availableTabs);
  const rootHref = `${roleConfig.rootPath}?tab=${roleConfig.defaultTab}`;

  const breadcrumbs: DashboardBreadcrumbItem[] = [
    {
      label: roleConfig.rootLabel,
      href: rootHref,
    },
  ];

  if (normalizedPath === roleConfig.rootPath) {
    breadcrumbs.push({ label: activeTabLabel });
    return breadcrumbs;
  }

  breadcrumbs.push({
    label: activeTabLabel,
    href: `${roleConfig.rootPath}?tab=${activeTab}`,
  });

  const nestedLabel = getNestedRouteLabel(role, normalizedPath);
  if (nestedLabel && nestedLabel !== activeTabLabel) {
    breadcrumbs.push({ label: nestedLabel });
  }

  return breadcrumbs;
}
