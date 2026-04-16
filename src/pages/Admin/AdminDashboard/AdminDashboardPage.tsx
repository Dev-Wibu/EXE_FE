import {
  Bell,
  BookOpen,
  CreditCard,
  FileQuestion,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Star,
  Trophy,
  UserCog,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { useCallback, useMemo } from "react";

import type { ChromeTabMenuGroup, SidebarMenuGroup } from "@/components/shared";
import { DashboardChromeTabs, DashboardSidebar } from "@/components/shared";
import { useTabsState } from "@/hooks/useTabsState";

import { CandidateProfileManagementPage } from "../CandidateProfileManagement";
import { DashboardOverviewPage } from "../DashboardOverview";
import { FeedbackManagementPage } from "../FeedbackManagement";
import { MembershipPlanManagementPage } from "../MembershipPlanManagement";
import { MentorManagementPage } from "../MentorManagement";
import { NotificationManagementPage } from "../NotificationManagement";
import { PostManagementPage } from "../PostManagement";
import { PracticeQuestionManagementPage } from "../PracticeQuestionManagement";
import { PracticeSetManagementPage } from "../PracticeSetManagement";
import { QuestionCategoryManagementPage } from "../QuestionCategoryManagement";
import { QuestionMajorManagementPage } from "../QuestionMajorManagement";
import { QuizSetManagementPage } from "../QuizSetManagement";
import { ReviewManagementPage } from "../ReviewManagement";
import { SessionManagementPage } from "../SessionManagement";
import { TransactionPaymentManagementPage } from "../TransactionPaymentManagement";
import { UserManagementPage } from "../UserManagement";

type TabType =
  | "dashboard"
  | "users"
  | "mentors"
  | "sessions"
  | "reviews"
  | "feedback"
  | "notifications"
  | "questionCategories"
  | "questionMajors"
  | "practiceSets"
  | "practiceQuestions"
  | "quizSets"
  | "posts"
  | "candidateProfiles"
  | "membershipPlans"
  | "transactionsPayments";

const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "dashboard", label: "Dashboard" },
  { type: "users", label: "User Management" },
  { type: "mentors", label: "Mentor Management" },
  { type: "sessions", label: "Session Management" },
  { type: "reviews", label: "Mentor Review Management" },
  { type: "feedback", label: "Candidate Feedback Management" },
  { type: "notifications", label: "Notification Management" },
  { type: "questionCategories", label: "Question Categories" },
  { type: "questionMajors", label: "Question Majors" },
  { type: "practiceSets", label: "Practice Sets" },
  { type: "practiceQuestions", label: "Practice Questions" },
  { type: "quizSets", label: "Quiz Sets" },
  { type: "posts", label: "Bài viết & Cộng đồng" },
  { type: "candidateProfiles", label: "Hồ sơ ứng viên" },
  { type: "membershipPlans", label: "Gói thành viên" },
  { type: "transactionsPayments", label: "Giao dịch & Thanh toán" },
];

const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

const TAB_ICONS: Record<TabType, React.ElementType> = {
  dashboard: LayoutDashboard,
  users: Users,
  mentors: UserCog,
  sessions: Video,
  reviews: Star,
  feedback: MessageSquare,
  notifications: Bell,
  questionCategories: FolderOpen,
  questionMajors: GraduationCap,
  practiceSets: BookOpen,
  practiceQuestions: FileQuestion,
  quizSets: Trophy,
  posts: Newspaper,
  candidateProfiles: FileText,
  membershipPlans: CreditCard,
  transactionsPayments: Wallet,
};

const TAB_COLORS: Record<TabType, string> = {
  dashboard: "text-indigo-600",
  users: "text-blue-600",
  mentors: "text-orange-600",
  sessions: "text-green-600",
  reviews: "text-yellow-600",
  feedback: "text-cyan-600",
  notifications: "text-red-600",
  questionCategories: "text-purple-600",
  questionMajors: "text-pink-600",
  practiceSets: "text-teal-600",
  practiceQuestions: "text-emerald-600",
  quizSets: "text-amber-600",
  posts: "text-purple-500",
  candidateProfiles: "text-teal-600",
  membershipPlans: "text-rose-600",
  transactionsPayments: "text-indigo-600",
};

const CHROME_TABS_MENU_GROUPS: ChromeTabMenuGroup[] = [
  {
    items: [
      {
        type: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        iconColor: "text-indigo-600",
      },
    ],
  },
  {
    items: [
      { type: "users", label: "User Management", icon: Users, iconColor: "text-blue-600" },
      { type: "mentors", label: "Mentor Management", icon: UserCog, iconColor: "text-orange-600" },
      { type: "sessions", label: "Session Management", icon: Video, iconColor: "text-green-600" },
    ],
  },
  {
    items: [
      {
        type: "reviews",
        label: "Mentor Review Management",
        icon: Star,
        iconColor: "text-yellow-600",
      },
      {
        type: "feedback",
        label: "Candidate Feedback Management",
        icon: MessageSquare,
        iconColor: "text-cyan-600",
      },
      {
        type: "notifications",
        label: "Notification Management",
        icon: Bell,
        iconColor: "text-red-600",
      },
    ],
  },
  {
    items: [
      {
        type: "questionCategories",
        label: "Question Categories",
        icon: FolderOpen,
        iconColor: "text-purple-600",
      },
      {
        type: "questionMajors",
        label: "Question Majors",
        icon: GraduationCap,
        iconColor: "text-pink-600",
      },
      { type: "practiceSets", label: "Practice Sets", icon: BookOpen, iconColor: "text-teal-600" },
    ],
  },
  {
    items: [
      {
        type: "posts",
        label: "Bài viết & Cộng đồng",
        icon: Newspaper,
        iconColor: "text-purple-500",
      },
      {
        type: "candidateProfiles",
        label: "Hồ sơ ứng viên",
        icon: FileText,
        iconColor: "text-teal-600",
      },
      {
        type: "membershipPlans",
        label: "Gói thành viên",
        icon: CreditCard,
        iconColor: "text-rose-600",
      },
      {
        type: "transactionsPayments",
        label: "Giao dịch & Thanh toán",
        icon: Wallet,
        iconColor: "text-indigo-600",
      },
    ],
  },
];

const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
  {
    label: "Management",
    items: [
      { type: "dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-indigo-600" },
      { type: "users", icon: Users, label: "Người dùng", color: "text-blue-600" },
      { type: "mentors", icon: UserCog, label: "Người hướng dẫn", color: "text-orange-600" },
      { type: "sessions", icon: Video, label: "Phiên phỏng vấn", color: "text-green-600" },
    ],
  },
  {
    label: "Đánh giá & phản hồi",
    items: [
      { type: "reviews", icon: Star, label: "Đánh giá của mentor", color: "text-yellow-600" },
      {
        type: "feedback",
        icon: MessageSquare,
        label: "Phản hồi từ ứng viên",
        color: "text-cyan-600",
      },
      { type: "notifications", icon: Bell, label: "Thông báo", color: "text-red-600" },
    ],
  },
  {
    label: "Questions",
    items: [
      { type: "questionCategories", icon: FolderOpen, label: "Bài học", color: "text-purple-600" },
      {
        type: "questionMajors",
        icon: GraduationCap,
        label: "Chuyên ngành",
        color: "text-pink-600",
      },
      { type: "practiceSets", icon: BookOpen, label: "Bộ câu hỏi ôn tập", color: "text-teal-600" },
      {
        type: "practiceQuestions",
        icon: FileQuestion,
        label: "Câu hỏi ôn tập",
        color: "text-emerald-600",
      },
      { type: "quizSets", icon: Trophy, label: "Bộ câu hỏi trắc nghiệm", color: "text-amber-600" },
    ],
  },
  {
    label: "Content",
    items: [
      {
        type: "posts",
        icon: Newspaper,
        label: "Bài viết & Cộng đồng",
        color: "text-purple-500",
      },
      {
        type: "candidateProfiles",
        icon: FileText,
        label: "Hồ sơ ứng viên",
        color: "text-teal-600",
      },
      {
        type: "membershipPlans",
        icon: CreditCard,
        label: "Gói thành viên",
        color: "text-rose-600",
      },
      {
        type: "transactionsPayments",
        icon: Wallet,
        label: "Giao dịch & Thanh toán",
        color: "text-indigo-600",
      },
    ],
  },
];

const ADMIN_SIDEBAR_LOGO = (
  <>
    <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
      <LayoutDashboard className="h-6 w-6 text-white" />
    </div>
    <div>
      <h1 className="font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
      <p className="text-xs text-gray-500 dark:text-slate-400">Administration</p>
    </div>
  </>
);

const ADMIN_SIDEBAR_LOGO_COLLAPSED = (
  <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
    <LayoutDashboard className="h-6 w-6 text-white" />
  </div>
);

export function AdminDashboardPage() {
  const { activeTab, openTabs, setActiveTab, openTab, closeTab } = useTabsState({
    storageKey: "admin",
    defaultTab: "dashboard",
    availableTabs: AVAILABLE_TABS,
  });

  const typedActiveTab: TabType = isValidTabType(activeTab) ? activeTab : "dashboard";

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
        setActiveTab(selectedTab.type);
      }
    },
    [openTabs, setActiveTab]
  );

  const handleNewTab = useCallback(
    (type: string) => {
      openTab(type);
    },
    [openTab]
  );

  const handleSidebarNavigate = useCallback(
    (type: string) => {
      setActiveTab(type);
    },
    [setActiveTab]
  );

  const renderContent = () => {
    switch (typedActiveTab) {
      case "dashboard":
        return <DashboardOverviewPage />;
      case "users":
        return <UserManagementPage />;
      case "mentors":
        return <MentorManagementPage />;
      case "sessions":
        return <SessionManagementPage />;
      case "reviews":
        return <ReviewManagementPage />;
      case "feedback":
        return <FeedbackManagementPage />;
      case "notifications":
        return <NotificationManagementPage />;
      case "questionCategories":
        return <QuestionCategoryManagementPage />;
      case "questionMajors":
        return <QuestionMajorManagementPage />;
      case "practiceSets":
        return <PracticeSetManagementPage />;
      case "practiceQuestions":
        return <PracticeQuestionManagementPage />;
      case "quizSets":
        return <QuizSetManagementPage />;
      case "posts":
        return <PostManagementPage />;
      case "candidateProfiles":
        return <CandidateProfileManagementPage />;
      case "membershipPlans":
        return <MembershipPlanManagementPage />;
      case "transactionsPayments":
        return <TransactionPaymentManagementPage />;
      default:
        return <div>Loại tab không hợp lệ</div>;
    }
  };

  return (
    <div className="isolate flex h-screen bg-gray-50 dark:bg-slate-950">
      <DashboardSidebar
        menuGroups={SIDEBAR_MENU_GROUPS}
        activeTab={typedActiveTab}
        onNavigate={handleSidebarNavigate}
        storageKey="admin_sidebar_collapsed"
        legacyStorageKey="manager_sidebar_collapsed"
        logo={ADMIN_SIDEBAR_LOGO}
        collapsedLogo={ADMIN_SIDEBAR_LOGO_COLLAPSED}
        showSettings
        settingsLabel="Settings"
        theme={{
          wrapper: "h-full border-r bg-white",
          expandedWidth: "w-64",
          toggleBtn:
            "absolute top-16 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700",
          toggleIconColor: "text-gray-600",
          logoBorder: "border-b",
          logoExpandedPadding: "gap-3 px-4 py-4",
          logoCollapsedPadding: "justify-center px-2 py-4",
          navWrapper: "flex-1 space-y-1 overflow-y-auto",
          navExpandedPadding: "p-4",
          navCollapsedPadding: "p-2",
          sectionLabel:
            "text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400",
          divider: "",
          itemPy: "py-2",
          activeItem: "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white",
          inactiveItem:
            "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
          footerBorder: "border-t",
          footerExpandedPadding: "p-4",
          footerCollapsedPadding: "p-2",
          themeToggleLabel: "Theme",
          logoutExpandedBtn:
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
          logoutCollapsedBtn:
            "flex items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
          logoutIcon: "",
          logoutLabel: "Logout",
        }}
      />

      <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
        <DashboardChromeTabs
          tabs={chromeTabsData}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={closeTab}
          onNewTab={handleNewTab}
          tabIcons={TAB_ICONS}
          tabColors={TAB_COLORS}
          menuGroups={CHROME_TABS_MENU_GROUPS}
          theme={{
            bg: "bg-gray-100",
            tabActiveBorder: "border-gray-300",
            tabActiveBg: "bg-white",
            tabInactiveBg: "bg-gray-200",
            tabInactiveHover: "hover:bg-gray-100",
            closeHover: "hover:bg-gray-300",
            addBtnBg: "bg-gray-200",
            addBtnHover: "hover:bg-gray-300",
            menuHover: "hover:bg-gray-100",
          }}
        />

        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
