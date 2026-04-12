import { cn } from "@/lib/utils";
import {
  Bot,
  CircleHelp,
  FileQuestion,
  GraduationCap,
  History,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useCallback } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { NotificationBell } from "@/components/notification";
import type { SidebarMenuGroup } from "@/components/shared";
import { DashboardSidebar } from "@/components/shared";
import { useTabsState } from "@/hooks/useTabsState";

import { AccountPage } from "../Account";
import { AIChatListPage } from "../AIChat";
import { AIInterviewListPage } from "../AIInterview";
import { UserFeedbackListPage } from "../Feedback";
import { HomeFeedPage } from "../HomeFeed";
import { MentorListPage } from "../MentorList/MentorListPage";
import { MessengerPage } from "../Messenger";
import { MockInterviewListPage, SessionHistoryPage } from "../MockInterview";
import { UserNotificationsPage } from "../Notifications";
import { OverviewPage } from "../Overview";
import { PracticeQuestionsPage, PracticeSetsPage } from "../Practice";
import { QuestionListPage } from "../Question";

type TabType =
  | "homeFeed"
  | "overview"
  | "mentors"
  | "mockInterview"
  | "interviewHistory"
  | "feedback"
  | "aiInterview"
  | "aiChat"
  | "questions"
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
  { type: "aiChat", label: "AI Chat" },
  { type: "questions", label: "Bộ câu hỏi" },
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
      { type: "aiChat", icon: MessageSquare, label: "AI Chat", color: "text-teal-600" },
      { type: "questions", icon: CircleHelp, label: "Bộ câu hỏi", color: "text-yellow-600" },
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
    <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
    <span className="text-lg font-bold text-[#002654] dark:text-white">INBLUE AI</span>
  </>
);

const USER_SIDEBAR_LOGO_COLLAPSED = (
  <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
);

const DEFAULT_TAB: TabType = "homeFeed";

/** Map sub-route path segments to their parent tab so the sidebar highlights correctly */
const ROUTE_TO_TAB: Record<string, TabType> = {
  mentors: "mentors",
  "ai-interview": "aiInterview",
  "mock-interview": "mockInterview",
  "ai-chat": "aiChat",
  practice: "practice",
  feedback: "feedback",
  community: "homeFeed",
  questions: "questions",
  messenger: "messenger",
};

function getTabFromRoute(pathname: string): TabType {
  // pathname looks like /user/ai-interview/setup — grab the first segment after /user/
  const segment = pathname.replace(/^\/user\//, "").split("/")[0];
  return ROUTE_TO_TAB[segment] ?? DEFAULT_TAB;
}

export function UserDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, openTab } = useTabsState({
    storageKey: "user",
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
      case "aiChat":
        return <AIChatListPage />;
      case "questions":
        return <QuestionListPage />;
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
        logo={USER_SIDEBAR_LOGO}
        collapsedLogo={USER_SIDEBAR_LOGO_COLLAPSED}
        theme={{
          wrapper: "sticky top-0 z-30 h-screen flex-shrink-0 border-r border-slate-100 bg-slate-50",
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

      <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
        <div className="flex h-12 items-center justify-end px-4">
          <NotificationBell notificationsPath="/user?tab=notifications" />
        </div>
        <div
          className={cn(
            "flex-1 overflow-hidden",
            typedActiveTab === "messenger" ? "p-0" : "overflow-auto p-6"
          )}>
          {outlet ?? renderContent()}
        </div>
      </div>
    </div>
  );
}
