import { cn } from "@/lib/utils";
import {
  Bot,
  FileQuestion,
  GraduationCap,
  History,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { NotificationBell } from "@/components/notification";
import type { SidebarMenuGroup } from "@/components/shared";
import {
  DashboardBreadcrumb,
  DashboardSidebar,
  DashboardSidebarToggle,
  getInitialSidebarCollapsed,
  SettingsModal,
} from "@/components/shared";
import { useDashboardBreadcrumb } from "@/hooks/useDashboardBreadcrumb";
import { useDashboardScrollRestoration } from "@/hooks/useDashboardScrollRestoration";
import { useTabsState } from "@/hooks/useTabsState";
import { getDashboardTabFromPath } from "@/lib/dashboard-breadcrumb";
import { useSettingsStore } from "@/stores/settingsStore";

import { AccountPage } from "../Account";
import { AIInterviewListPage } from "../AIInterview";
import { UserFeedbackListPage } from "../Feedback";
import { HomeFeedPage } from "../HomeFeed";
import { MentorListPage } from "../MentorList/MentorListPage";
import { MessengerPage } from "../Messenger";
import { MockInterviewListPage, SessionHistoryPage } from "../MockInterview";
import { UserNotificationsPage } from "../Notifications";
import { OverviewPage } from "../Overview";
import { PracticeQuestionsPage, PracticeSetsPage } from "../Practice";

type TabType =
  | "homeFeed"
  | "overview"
  | "mentors"
  | "mockInterview"
  | "interviewHistory"
  | "feedback"
  | "aiInterview"
  | "practice"
  | "practiceQuestions"
  | "notifications"
  | "messenger"
  | "account";

const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "homeFeed", label: "Trang chủ" },
  { type: "overview", label: "Tổng quan" },
  { type: "mentors", label: "Danh sách Mentor" },
  { type: "mockInterview", label: "Phỏng vấn với Mentor" },
  { type: "interviewHistory", label: "Lịch sử phỏng vấn" },
  { type: "feedback", label: "Đánh giá từ Mentor" },
  { type: "aiInterview", label: "Phỏng vấn với AI" },
  { type: "practice", label: "Bộ luyện tập" },
  { type: "practiceQuestions", label: "Câu hỏi luyện tập" },
  { type: "notifications", label: "Thông báo" },
  { type: "messenger", label: "Tin nhắn" },
  { type: "account", label: "Tài khoản" },
];

const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
  {
    label: "Trang chủ",
    items: [{ type: "homeFeed", icon: Newspaper, label: "Trang chủ", color: "text-orange-600" }],
  },
  {
    label: "Phỏng vấn",
    items: [
      { type: "overview", icon: LayoutDashboard, label: "Tổng quan", color: "text-blue-600" },
      { type: "mentors", icon: UserIcon, label: "Danh sách Mentor", color: "text-indigo-600" },
      {
        type: "mockInterview",
        icon: Users,
        label: "Phỏng vấn với Mentor",
        color: "text-purple-600",
      },
      {
        type: "interviewHistory",
        icon: History,
        label: "Lịch sử phỏng vấn",
        color: "text-orange-600",
      },
      {
        type: "feedback",
        icon: MessageSquare,
        label: "Đánh giá từ Mentor",
        color: "text-cyan-600",
      },
    ],
  },
  {
    label: "AI & Học tập",
    items: [
      { type: "aiInterview", icon: Bot, label: "Phỏng vấn với AI", color: "text-green-600" },
      {
        type: "practice",
        icon: GraduationCap,
        label: "Luyện tập",
        color: "text-indigo-600",
        children: [
          {
            type: "practice",
            icon: GraduationCap,
            label: "Bộ luyện tập",
            color: "text-indigo-600",
          },
          {
            type: "practiceQuestions",
            icon: FileQuestion,
            label: "Câu hỏi luyện tập",
            color: "text-violet-600",
          },
        ],
      },
    ],
  },
  {
    label: "Cá nhân",
    items: [
      { type: "messenger", icon: MessageSquare, label: "Tin nhắn", color: "text-blue-500" },
      { type: "account", icon: UserIcon, label: "Tài khoản", color: "text-gray-600" },
    ],
  },
];

const USER_SIDEBAR_LOGO = (
  <>
    <img src={icon2} alt="INBLUE AI" className="h-9 w-9 shrink-0" />
    <span className="text-lg font-bold text-[#002654] dark:text-white">INBLUE AI</span>
  </>
);

const USER_SIDEBAR_LOGO_COLLAPSED = (
  <img src={icon2} alt="INBLUE AI" className="h-9 w-9 shrink-0" />
);

const DEFAULT_TAB: TabType = "homeFeed";

export function UserDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarBehavior = useSettingsStore((state) => state.sidebarBehavior);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getInitialSidebarCollapsed(
      "user_dashboard_sidebar_collapsed",
      undefined,
      sidebarBehavior === "auto-collapse"
    )
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { activeTab, openTab } = useTabsState({
    storageKey: "user",
    defaultTab: DEFAULT_TAB,
    availableTabs: AVAILABLE_TABS,
  });

  const outlet = useOutlet();

  const routedTab = getDashboardTabFromPath({
    role: "user",
    pathname: location.pathname,
    defaultTab: DEFAULT_TAB,
  });

  // When on a nested outlet route, derive active tab from the pathname
  const typedActiveTab: TabType = outlet
    ? isValidTabType(routedTab)
      ? routedTab
      : DEFAULT_TAB
    : isValidTabType(activeTab)
      ? activeTab
      : DEFAULT_TAB;

  const { items: breadcrumbItems } = useDashboardBreadcrumb({
    role: "user",
    pathname: location.pathname,
    activeTab: typedActiveTab,
    availableTabs: AVAILABLE_TABS,
  });

  useDashboardScrollRestoration(contentRef, {
    enabled: typedActiveTab !== "messenger",
  });

  useEffect(() => {
    setIsSidebarCollapsed(sidebarBehavior === "auto-collapse");
  }, [sidebarBehavior]);

  // When on a nested route (outlet), navigate back to the dashboard base with the tab param
  const handleNavigate = useCallback(
    (type: string) => {
      if (outlet) {
        navigate(`/user?tab=${type}`);
      } else {
        openTab(type);
      }
    },
    [outlet, openTab, navigate]
  );

  const renderContent = () => {
    switch (typedActiveTab) {
      case "homeFeed":
        return <HomeFeedPage />;
      case "overview":
        return <OverviewPage />;
      case "mentors":
        return <MentorListPage />;
      case "mockInterview":
        return <MockInterviewListPage />;
      case "interviewHistory":
        return <SessionHistoryPage />;
      case "feedback":
        return <UserFeedbackListPage />;
      case "aiInterview":
        return <AIInterviewListPage />;
      case "practice":
        return <PracticeSetsPage />;
      case "practiceQuestions":
        return <PracticeQuestionsPage />;
      case "notifications":
        return <UserNotificationsPage />;
      case "messenger":
        return <MessengerPage />;
      case "account":
        return <AccountPage />;
      default:
        return <div>Loại tab không hợp lệ</div>;
    }
  };

  return (
    <div className="isolate flex h-screen bg-white dark:bg-slate-950">
      <DashboardSidebar
        menuGroups={SIDEBAR_MENU_GROUPS}
        activeTab={typedActiveTab}
        onNavigate={handleNavigate}
        storageKey="user_dashboard_sidebar_collapsed"
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        showDesktopToggle={false}
        logo={USER_SIDEBAR_LOGO}
        collapsedLogo={USER_SIDEBAR_LOGO_COLLAPSED}
        showSettings
        settingsLabel="Cài đặt"
        onSettingsClick={() => setIsSettingsOpen(true)}
        theme={{
          wrapper: "h-screen flex-shrink-0 border-r border-slate-200 bg-slate-50",
          expandedWidth: "w-56",
          collapsedWidth: "w-16",
          logoBorder: "border-b border-slate-200",
          logoExpandedPadding: "h-14 gap-2 px-4",
          logoCollapsedPadding: "h-14 justify-center px-2",
          navWrapper: "flex flex-1 flex-col gap-1 py-4",
          navExpandedPadding: "px-3",
          navCollapsedPadding: "px-2",
          sectionLabel:
            "px-3 text-xs font-semibold tracking-wider text-slate-500/70 uppercase dark:text-slate-500",
          divider: "border-slate-100",
          itemPy: "py-2.5",
          activeItem: "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]",
          inactiveItem:
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          activeIconOverride: "text-[#0047AB] dark:text-[#66B2FF]",
          flyoutActiveItem:
            "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]",
          flyoutInactiveItem:
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
          flyoutActiveIcon: "text-[#0047AB] dark:text-[#66B2FF]",
          flyoutBorder: "border-slate-200",
          footerBorder: "border-t border-slate-200",
          footerExpandedPadding: "p-3",
          footerCollapsedPadding: "p-2",
          logoutExpandedBtn:
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutCollapsedBtn:
            "flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutIcon: "text-slate-500 dark:text-slate-400",
          logoutLabel: "Đăng xuất",
        }}
      />

      <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
        <div className="relative z-60 flex h-14 items-center justify-between border-b border-slate-200 bg-white pr-4 pl-16 md:px-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="hidden shrink-0 pr-2 md:flex">
            <DashboardSidebarToggle
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          </div>
          <DashboardBreadcrumb items={breadcrumbItems} className="min-w-0 flex-1" />
          <div className="shrink-0 pl-3">
            <NotificationBell notificationsPath="/user?tab=notifications" />
          </div>
        </div>
        <div
          ref={contentRef}
          className={cn(
            "flex-1 overflow-hidden",
            typedActiveTab === "messenger" || typedActiveTab === "mentors"
              ? "p-0"
              : "overflow-auto p-6"
          )}>
          {outlet ?? renderContent()}
        </div>
      </div>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
