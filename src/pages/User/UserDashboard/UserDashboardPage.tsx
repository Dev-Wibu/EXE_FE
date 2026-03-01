import {
  Bell,
  Bot,
  CircleHelp,
  FileQuestion,
  GraduationCap,
  History,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
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

import { AccountPage } from "../Account";
import { AIChatListPage } from "../AIChat";
import { AIInterviewListPage } from "../AIInterview";
import { PostListPage } from "../Community";
import { UserFeedbackListPage } from "../Feedback";
import { MockInterviewListPage, SessionHistoryPage } from "../MockInterview";
import { UserNotificationsPage } from "../Notifications";
import { OverviewPage } from "../Overview";
import { PracticeQuestionsPage, PracticeSetsPage } from "../Practice";
import { QuestionListPage } from "../Question";

type TabType =
  | "overview"
  | "mockInterview"
  | "interviewHistory"
  | "feedback"
  | "aiInterview"
  | "aiChat"
  | "questions"
  | "practice"
  | "practiceQuestions"
  | "community"
  | "notifications"
  | "account";

const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "overview", label: "Tổng quan" },
  { type: "mockInterview", label: "Phỏng vấn với Mentor" },
  { type: "interviewHistory", label: "Lịch sử phỏng vấn" },
  { type: "feedback", label: "Phản hồi từ Mentor" },
  { type: "aiInterview", label: "Phỏng vấn với AI" },
  { type: "aiChat", label: "AI Chat" },
  { type: "questions", label: "Bộ câu hỏi" },
  { type: "practice", label: "Bộ luyện tập" },
  { type: "practiceQuestions", label: "Câu hỏi luyện tập" },
  { type: "community", label: "Cộng đồng" },
  { type: "notifications", label: "Thông báo" },
  { type: "account", label: "Tài khoản" },
];

const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

const TAB_ICONS: Record<TabType, React.ElementType> = {
  overview: LayoutDashboard,
  mockInterview: Users,
  interviewHistory: History,
  feedback: MessageSquare,
  aiInterview: Bot,
  aiChat: MessageSquare,
  questions: CircleHelp,
  practice: GraduationCap,
  practiceQuestions: CircleHelp,
  community: Newspaper,
  notifications: Bell,
  account: User,
};

const TAB_COLORS: Record<TabType, string> = {
  overview: "text-blue-600",
  mockInterview: "text-purple-600",
  interviewHistory: "text-orange-600",
  feedback: "text-cyan-600",
  aiInterview: "text-green-600",
  aiChat: "text-teal-600",
  questions: "text-yellow-600",
  practice: "text-indigo-600",
  practiceQuestions: "text-violet-600",
  community: "text-orange-500",
  notifications: "text-red-600",
  account: "text-gray-600",
};

const CHROME_TABS_MENU_GROUPS: ChromeTabMenuGroup[] = [
  {
    items: [
      { type: "overview", label: "Tổng quan", icon: LayoutDashboard, iconColor: "text-blue-600" },
      {
        type: "mockInterview",
        label: "Phỏng vấn với Mentor",
        icon: Users,
        iconColor: "text-purple-600",
      },
      {
        type: "interviewHistory",
        label: "Lịch sử phỏng vấn",
        icon: History,
        iconColor: "text-orange-600",
      },
      {
        type: "feedback",
        label: "Phản hồi từ Mentor",
        icon: MessageSquare,
        iconColor: "text-cyan-600",
      },
    ],
  },
  {
    items: [
      { type: "aiInterview", label: "Phỏng vấn với AI", icon: Bot, iconColor: "text-green-600" },
      { type: "aiChat", label: "AI Chat", icon: MessageSquare, iconColor: "text-teal-600" },
      { type: "questions", label: "Bộ câu hỏi", icon: CircleHelp, iconColor: "text-yellow-600" },
      {
        type: "practice",
        label: "Bộ luyện tập",
        icon: GraduationCap,
        iconColor: "text-indigo-600",
      },
      {
        type: "practiceQuestions",
        label: "Câu hỏi luyện tập",
        icon: CircleHelp,
        iconColor: "text-violet-600",
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
    label: "Phỏng vấn",
    items: [
      { type: "overview", icon: LayoutDashboard, label: "Tổng quan", color: "text-blue-600" },
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
        label: "Phản hồi từ Mentor",
        color: "text-cyan-600",
      },
    ],
  },
  {
    label: "AI & Học tập",
    items: [
      { type: "aiInterview", icon: Bot, label: "Phỏng vấn với AI", color: "text-green-600" },
      { type: "aiChat", icon: MessageSquare, label: "AI Chat", color: "text-teal-600" },
      { type: "questions", icon: CircleHelp, label: "Bộ câu hỏi", color: "text-yellow-600" },
      { type: "community", icon: Newspaper, label: "Cộng đồng", color: "text-orange-500" },
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
      { type: "notifications", icon: Bell, label: "Thông báo", color: "text-red-600" },
      { type: "account", icon: User, label: "Tài khoản", color: "text-gray-600" },
    ],
  },
];

const USER_SIDEBAR_LOGO = (
  <>
    <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
    <span className="text-lg font-bold text-[#002654] dark:text-white">INBLUE AI</span>
  </>
);

const USER_SIDEBAR_LOGO_COLLAPSED = (
  <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
);

const DEFAULT_TAB: TabType = "overview";

export function UserDashboardPage() {
  const navigate = useNavigate();
  const { activeTab, openTabs, setActiveTab, openTab, closeTab } = useTabsState({
    storageKey: "user",
    defaultTab: DEFAULT_TAB,
    availableTabs: AVAILABLE_TABS,
  });

  const outlet = useOutlet();

  const typedActiveTab: TabType = isValidTabType(activeTab) ? activeTab : DEFAULT_TAB;

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
          navigate(`/user?tab=${selectedTab.type}`);
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
        navigate(`/user?tab=${type}`);
      } else {
        openTab(type);
      }
    },
    [openTab, outlet, navigate]
  );

  const renderContent = () => {
    switch (typedActiveTab) {
      case "overview":
        return <OverviewPage />;
      case "mockInterview":
        return <MockInterviewListPage />;
      case "interviewHistory":
        return <SessionHistoryPage />;
      case "feedback":
        return <UserFeedbackListPage />;
      case "aiInterview":
        return <AIInterviewListPage />;
      case "aiChat":
        return <AIChatListPage />;
      case "questions":
        return <QuestionListPage />;
      case "practice":
        return <PracticeSetsPage />;
      case "practiceQuestions":
        return <PracticeQuestionsPage />;
      case "community":
        return <PostListPage />;
      case "notifications":
        return <UserNotificationsPage />;
      case "account":
        return <AccountPage />;
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
        storageKey="user_dashboard_sidebar_collapsed"
        logo={USER_SIDEBAR_LOGO}
        collapsedLogo={USER_SIDEBAR_LOGO_COLLAPSED}
        theme={{
          wrapper: "sticky top-0 h-screen flex-shrink-0 border-r border-slate-100 bg-slate-50",
          expandedWidth: "w-72",
          toggleBtn:
            "absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700",
          toggleIconColor: "text-slate-600",
          logoBorder: "border-b border-slate-100",
          logoExpandedPadding: "h-16 gap-2 px-6",
          logoCollapsedPadding: "h-16 justify-center px-2",
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
          footerBorder: "border-t border-slate-100",
          footerExpandedPadding: "p-3",
          footerCollapsedPadding: "p-2",
          themeToggleLabel: "Giao diện",
          logoutExpandedBtn:
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutCollapsedBtn:
            "flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
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
          rightSlot={<NotificationBell notificationsPath="/user?tab=notifications" />}
          theme={{
            bg: "bg-slate-50",
            tabActiveBorder: "border-slate-200",
            tabActiveBg: "bg-white",
            tabInactiveBg: "bg-slate-100",
            tabInactiveHover: "hover:bg-white",
            closeHover: "hover:bg-slate-200",
            addBtnBg: "bg-slate-100",
            addBtnHover: "hover:bg-slate-200",
            menuHover: "hover:bg-slate-50",
            menuWidth: "w-52",
          }}
        />

        <div className="flex-1 overflow-auto p-6">{outlet ?? renderContent()}</div>
      </div>
    </div>
  );
}
