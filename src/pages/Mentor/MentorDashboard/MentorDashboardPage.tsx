import {
  Bell,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Star,
  User,
  Users,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useOutlet } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { NotificationBell } from "@/components/notification";
import type { ChromeTabMenuGroup, SidebarMenuGroup } from "@/components/shared";
import { DashboardChromeTabs, DashboardSidebar } from "@/components/shared";
import { useTabsState } from "@/hooks/useTabsState";

import { PostListPage } from "../../User/Community";
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
  | "community"
  | "notifications"
  | "account";

const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "overview", label: "Tổng quan" },
  { type: "sessions", label: "Phiên phỏng vấn" },
  { type: "students", label: "Học viên" },
  { type: "reviews", label: "Đánh giá" },
  { type: "feedback", label: "Phản hồi đã gửi" },
  { type: "community", label: "Cộng đồng" },
  { type: "notifications", label: "Thông báo" },
  { type: "account", label: "Tài khoản" },
];

const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

const TAB_ICONS: Record<TabType, React.ElementType> = {
  overview: LayoutDashboard,
  sessions: Calendar,
  students: Users,
  reviews: Star,
  feedback: MessageSquare,
  community: Newspaper,
  notifications: Bell,
  account: User,
};

const TAB_COLORS: Record<TabType, string> = {
  overview: "text-emerald-600",
  sessions: "text-blue-600",
  students: "text-purple-600",
  reviews: "text-yellow-600",
  feedback: "text-cyan-600",
  community: "text-orange-500",
  notifications: "text-red-600",
  account: "text-gray-600",
};

const CHROME_TABS_MENU_GROUPS: ChromeTabMenuGroup[] = [
  {
    items: [
      {
        type: "overview",
        label: "Tổng quan",
        icon: LayoutDashboard,
        iconColor: "text-emerald-600",
      },
      { type: "sessions", label: "Phiên phỏng vấn", icon: Calendar, iconColor: "text-blue-600" },
      { type: "students", label: "Học viên", icon: Users, iconColor: "text-purple-600" },
    ],
  },
  {
    items: [
      { type: "reviews", label: "Đánh giá", icon: Star, iconColor: "text-yellow-600" },
      {
        type: "feedback",
        label: "Phản hồi đã gửi",
        icon: MessageSquare,
        iconColor: "text-cyan-600",
      },
      { type: "community", label: "Cộng đồng", icon: Newspaper, iconColor: "text-orange-500" },
    ],
  },
  {
    items: [
      { type: "notifications", label: "Thông báo", icon: Bell, iconColor: "text-red-600" },
      { type: "account", label: "Tài khoản", icon: User, iconColor: "text-gray-600" },
    ],
  },
];

const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
  {
    label: "Nghiệp vụ",
    items: [
      { type: "overview", icon: LayoutDashboard, label: "Tổng quan", color: "text-emerald-600" },
      { type: "sessions", icon: Calendar, label: "Phiên phỏng vấn", color: "text-blue-600" },
      { type: "students", icon: Users, label: "Học viên", color: "text-purple-600" },
      { type: "reviews", icon: Star, label: "Đánh giá", color: "text-yellow-600" },
      { type: "feedback", icon: MessageSquare, label: "Phản hồi đã gửi", color: "text-cyan-600" },
      { type: "community", icon: Newspaper, label: "Cộng đồng", color: "text-orange-500" },
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

export function MentorDashboardPage() {
  const navigate = useNavigate();
  const { activeTab, openTabs, setActiveTab, openTab, closeTab } = useTabsState({
    storageKey: "mentor",
    defaultTab: DEFAULT_TAB,
    availableTabs: AVAILABLE_TABS,
  });

  const outlet = useOutlet();

  const typedActiveTab: TabType = isValidTabType(activeTab) ? activeTab : DEFAULT_TAB;

  // When on a nested route (outlet), navigate back to the dashboard base with the tab param
  const handleNavigate = useCallback(
    (type: string) => {
      if (outlet) {
        navigate(`/mentor-dashboard?tab=${type}`);
      } else {
        openTab(type);
      }
    },
    [outlet, openTab, navigate]
  );

  const chromeTabsData = useMemo(() => {
    return openTabs
      .filter((tab) => isValidTabType(tab.type))
      .map((tab) => ({
        id: tab.id,
        type: tab.type,
        title: tab.label,
      }));
  }, [openTabs]);

  const activeTabId = useMemo(() => {
    const activeTabData = openTabs.find((tab) => tab.type === activeTab);
    return activeTabData?.id || "";
  }, [openTabs, activeTab]);

  const handleTabSelect = useCallback(
    (tabId: string) => {
      const selectedTab = openTabs.find((tab) => tab.id === tabId);
      if (selectedTab) {
        if (outlet) {
          navigate(`/mentor-dashboard?tab=${selectedTab.type}`);
        } else {
          setActiveTab(selectedTab.type);
        }
      }
    },
    [openTabs, setActiveTab, outlet, navigate]
  );

  const handleNewTab = useCallback(
    (type: string) => {
      if (outlet) {
        navigate(`/mentor-dashboard?tab=${type}`);
      } else {
        openTab(type);
      }
    },
    [openTab, outlet, navigate]
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
      case "community":
        return <PostListPage />;
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
        <DashboardChromeTabs
          tabs={chromeTabsData}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={closeTab}
          onNewTab={handleNewTab}
          tabIcons={TAB_ICONS}
          tabColors={TAB_COLORS}
          menuGroups={CHROME_TABS_MENU_GROUPS}
          rightSlot={<NotificationBell notificationsPath="/mentor?tab=notifications" />}
          theme={{
            bg: "bg-emerald-50",
            tabActiveBorder: "border-emerald-200",
            tabActiveBg: "bg-white",
            tabInactiveBg: "bg-emerald-100",
            tabInactiveHover: "hover:bg-emerald-50",
            closeHover: "hover:bg-emerald-200",
            addBtnBg: "bg-emerald-100",
            addBtnHover: "hover:bg-emerald-200",
            menuHover: "hover:bg-emerald-50",
          }}
        />

        <div className="flex-1 overflow-auto p-6">{outlet ?? renderContent()}</div>
      </div>
    </div>
  );
}
