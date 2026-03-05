import { Bell, Calendar, LayoutDashboard, MessageSquare, Star, User, Users } from "lucide-react";
import { useCallback } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { NotificationBell } from "@/components/notification";
import type { SidebarMenuGroup } from "@/components/shared";
import { DashboardSidebar } from "@/components/shared";
import { useTabsState } from "@/hooks/useTabsState";

import { MentorAccountPage } from "../Account";
import { GivenFeedbackListPage } from "../Feedback";
import { MentorNotificationsPage } from "../Notifications";
import { MentorOverviewPage } from "../Overview";
import { MentorReviewsPage } from "../Reviews";
import { MentorSessionsPage } from "../Sessions";
import { StudentsListPage } from "../Students";

type TabType =
  | "overview"
  | "sessions"
  | "students"
  | "reviews"
  | "feedback"
  | "notifications"
  | "account";

const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "overview", label: "Tổng quan" },
  { type: "sessions", label: "Phiên phỏng vấn" },
  { type: "students", label: "Học viên" },
  { type: "reviews", label: "Đánh giá" },
  { type: "feedback", label: "Phản hồi đã gửi" },
  { type: "notifications", label: "Thông báo" },
  { type: "account", label: "Tài khoản" },
];

const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
  {
    label: "Nghiệp vụ",
    items: [
      { type: "overview", icon: LayoutDashboard, label: "Tổng quan", color: "text-emerald-600" },
      { type: "sessions", icon: Calendar, label: "Phiên phỏng vấn", color: "text-blue-600" },
      { type: "students", icon: Users, label: "Học viên", color: "text-purple-600" },
      { type: "reviews", icon: Star, label: "Đánh giá", color: "text-yellow-600" },
      { type: "feedback", icon: MessageSquare, label: "Phản hồi đã gửi", color: "text-cyan-600" },
    ],
  },
  {
    label: "Cá nhân",
    items: [
      { type: "notifications", icon: Bell, label: "Thông báo", color: "text-red-600" },
      { type: "account", icon: User, label: "Tài khoản", color: "text-gray-600" },
    ],
  },
];

const MENTOR_SIDEBAR_LOGO = (
  <>
    <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="text-lg font-bold text-emerald-700 dark:text-white">INBLUE AI</span>
      <span className="text-xs text-emerald-600 dark:text-emerald-400">Cổng Mentor</span>
    </div>
  </>
);

const MENTOR_SIDEBAR_LOGO_COLLAPSED = (
  <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
);

const DEFAULT_TAB: TabType = "overview";

/** Map sub-route path segments to their parent tab so the sidebar highlights correctly */
const MENTOR_ROUTE_TO_TAB: Record<string, TabType> = {
  sessions: "sessions",
  reviews: "reviews",
  students: "students",
  community: "overview",
};

function getTabFromRoute(pathname: string): TabType {
  const segment = pathname.replace(/^\/mentor\//, "").split("/")[0];
  return MENTOR_ROUTE_TO_TAB[segment] ?? DEFAULT_TAB;
}

export function MentorDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, openTab } = useTabsState({
    storageKey: "mentor",
    defaultTab: DEFAULT_TAB,
    availableTabs: AVAILABLE_TABS,
  });

  const outlet = useOutlet();

  // When on a nested outlet route, derive active tab from the pathname
  const typedActiveTab: TabType = outlet
    ? getTabFromRoute(location.pathname)
    : isValidTabType(activeTab)
      ? activeTab
      : DEFAULT_TAB;

  // When on a nested route (outlet), navigate back to the dashboard base with the tab param
  const handleNavigate = useCallback(
    (type: string) => {
      if (outlet) {
        navigate(`/mentor?tab=${type}`);
      } else {
        openTab(type);
      }
    },
    [outlet, openTab, navigate]
  );

  const renderContent = () => {
    switch (typedActiveTab) {
      case "overview":
        return <MentorOverviewPage />;
      case "sessions":
        return <MentorSessionsPage />;
      case "students":
        return <StudentsListPage />;
      case "reviews":
        return <MentorReviewsPage />;
      case "feedback":
        return <GivenFeedbackListPage />;
      case "notifications":
        return <MentorNotificationsPage />;
      case "account":
        return <MentorAccountPage />;
      default:
        return <div>Loại tab không hợp lệ</div>;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      <DashboardSidebar
        menuGroups={SIDEBAR_MENU_GROUPS}
        activeTab={typedActiveTab}
        onNavigate={handleNavigate}
        storageKey="mentor_dashboard_sidebar_collapsed"
        logo={MENTOR_SIDEBAR_LOGO}
        collapsedLogo={MENTOR_SIDEBAR_LOGO_COLLAPSED}
        theme={{
          wrapper: "h-screen border-r border-emerald-100 bg-emerald-50/50",
          expandedWidth: "w-72",
          toggleBtn:
            "absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm transition-colors hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700",
          toggleIconColor: "text-emerald-600",
          logoBorder: "border-b border-emerald-100",
          logoExpandedPadding: "h-16 gap-2 px-6",
          logoCollapsedPadding: "h-16 justify-center px-2",
          navWrapper: "flex flex-1 flex-col gap-1 overflow-y-auto py-4",
          navExpandedPadding: "px-3",
          navCollapsedPadding: "px-2",
          sectionLabel:
            "px-3 text-xs font-semibold tracking-wider text-emerald-600/70 uppercase dark:text-slate-500",
          divider: "border-emerald-100",
          itemPy: "py-2.5",
          activeItem:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          inactiveItem:
            "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400",
          activeIconOverride: "text-emerald-600 dark:text-emerald-400",
          footerBorder: "border-t border-emerald-100",
          footerExpandedPadding: "p-3",
          footerCollapsedPadding: "p-2",
          themeToggleLabel: "Giao diện",
          logoutExpandedBtn:
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutCollapsedBtn:
            "flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutIcon: "text-slate-500 dark:text-slate-400",
          logoutLabel: "Đăng xuất",
        }}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-12 items-center justify-end px-4">
          <NotificationBell notificationsPath="/mentor?tab=notifications" />
        </div>
        <div className="flex-1 overflow-auto p-6">{outlet ?? renderContent()}</div>
      </div>
    </div>
  );
}
