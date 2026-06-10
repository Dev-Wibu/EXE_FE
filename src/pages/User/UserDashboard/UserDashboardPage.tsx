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
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardBreadcrumb } from "@/hooks/useDashboardBreadcrumb";
import { useDashboardScrollRestoration } from "@/hooks/useDashboardScrollRestoration";
import { useTabsState } from "@/hooks/useTabsState";
import { authManager } from "@/services/auth.manager";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";
import { getDashboardTabFromPath } from "@/lib/dashboard-breadcrumb";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Bot,
  Briefcase,
  FileQuestion,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
  User as UserIcon,
  UserCircle,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { toast } from "sonner";
import { AIInterviewListPage } from "../AIInterview";
import { ApplicationHistoryPage } from "../ApplicationHistory";
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
  | "applicationHistory"
  | "feedback"
  | "aiInterview"
  | "practice"
  | "practiceQuestions"
  | "notifications"
  | "messenger";
const isValidTabType = (value: string): value is TabType => {
  return [
    "homeFeed",
    "overview",
    "mentors",
    "mockInterview",
    "interviewHistory",
    "applicationHistory",
    "feedback",
    "aiInterview",
    "practice",
    "practiceQuestions",
    "notifications",
    "messenger",
  ].includes(value as TabType);
};
const getAvailableTabs = (
  t: (key: string) => string
): Array<{
  type: TabType;
  label: string;
}> => [
  {
    type: "homeFeed",
    label: t("common.home"),
  },
  {
    type: "overview",
    label: t("common.overview"),
  },
  {
    type: "mentors",
    label: t("common.mentors"),
  },
  {
    type: "mockInterview",
    label: t("common.interviewWithMentor"),
  },
  {
    type: "interviewHistory",
    label: t("common.interviewHistory"),
  },
  {
    type: "applicationHistory",
    label: t("common.applicationHistory"),
  },
  {
    type: "feedback",
    label: t("common.feedbackFromMentors"),
  },
  {
    type: "aiInterview",
    label: t("common.aiInterview1"),
  },
  {
    type: "practice",
    label: t("common.trainingSet"),
  },
  {
    type: "practiceQuestions",
    label: t("common.practiceQuestions"),
  },
  {
    type: "notifications",
    label: t("common.notification"),
  },
  {
    type: "messenger",
    label: t("common.messages"),
  },
];
const getSidebarMenuGroups = (t: (key: string) => string): SidebarMenuGroup[] => [
  {
    label: t("common.home"),
    items: [
      {
        type: "homeFeed",
        icon: Newspaper,
        label: t("common.home"),
        color: "text-orange-600",
      },
    ],
  },
  {
    label: t("common.interview"),
    items: [
      {
        type: "overview",
        icon: LayoutDashboard,
        label: t("common.overview"),
        color: "text-blue-600",
      },
      {
        type: "mentors",
        icon: UserIcon,
        label: t("common.mentors"),
        color: "text-indigo-600",
      },
      {
        type: "mockInterview",
        icon: Users,
        label: t("common.interviewWithMentor"),
        color: "text-purple-600",
      },
      {
        type: "interviewHistory",
        icon: History,
        label: t("common.interviewHistory"),
        color: "text-orange-600",
      },
      {
        type: "applicationHistory",
        icon: Briefcase,
        label: t("common.applicationHistory"),
        color: "text-teal-600",
      },
      {
        type: "feedback",
        icon: MessageSquare,
        label: t("common.feedbackFromMentors"),
        color: "text-cyan-600",
      },
    ],
  },
  {
    label: t("common.aiLearning"),
    items: [
      {
        type: "aiInterview",
        icon: Bot,
        label: t("common.aiInterview1"),
        color: "text-green-600",
      },
      {
        type: "practice",
        icon: GraduationCap,
        label: t("common.practice"),
        color: "text-indigo-600",
        children: [
          {
            type: "practice",
            icon: GraduationCap,
            label: t("common.trainingSet"),
            color: "text-indigo-600",
          },
          {
            type: "practiceQuestions",
            icon: FileQuestion,
            label: t("common.practiceQuestions"),
            color: "text-violet-600",
          },
        ],
      },
    ],
  },
  {
    label: t("common.individual"),
    items: [
      {
        type: "messenger",
        icon: MessageSquare,
        label: t("common.messages"),
        color: "text-blue-500",
      },
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarBehavior = useSettingsStore((state) => state.sidebarBehavior);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollTarget, setScrollTarget] = useState<HTMLDivElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getInitialSidebarCollapsed(
      "user_dashboard_sidebar_collapsed",
      undefined,
      sidebarBehavior === "auto-collapse"
    )
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const availableTabs = useMemo(() => getAvailableTabs(t), [t]);
  const sidebarMenuGroups = useMemo(() => getSidebarMenuGroups(t), [t]);
  const { activeTab, openTab } = useTabsState({
    storageKey: "user",
    defaultTab: DEFAULT_TAB,
    availableTabs: availableTabs,
  });
  const outlet = useOutlet();
  const routedTab = getDashboardTabFromPath({
    role: "user",
    pathname: location.pathname,
    defaultTab: DEFAULT_TAB,
    t,
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
    availableTabs: availableTabs,
  });
  const shouldHideScrollButton =
    location.pathname.startsWith("/user/ai-interview/session") ||
    location.pathname.startsWith("/user/mock-interview/room/");
  const handleContentRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    setScrollTarget(node);
  }, []);
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

  const handleLogout = useCallback(async () => {
    await authManager.logout();
    useAuthStore.getState().clearAuth();
    toast.success(t("common.loggedOutSuccessfully"));
    navigate("/login");
  }, [navigate, t]);

  const user = useAuthStore((state) => state.user);

  function getInitials(name?: string): string {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
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
      case "applicationHistory":
        return <ApplicationHistoryPage />;
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
      default:
        return <div>{t("common.invalidTabType")}</div>;
    }
  };
  return (
    <div className="isolate flex h-screen bg-white dark:bg-slate-950">
      <DashboardSidebar
        menuGroups={sidebarMenuGroups}
        activeTab={typedActiveTab}
        onNavigate={handleNavigate}
        storageKey="user_dashboard_sidebar_collapsed"
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        showDesktopToggle={false}
        logo={USER_SIDEBAR_LOGO}
        collapsedLogo={USER_SIDEBAR_LOGO_COLLAPSED}
        showSettings
        settingsLabel={t("common.systemSettings")}
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
          logoutLabel: t("common.logout"),
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
          <div className="flex shrink-0 items-center gap-3 pl-3">
            <NotificationBell notificationsPath="/user?tab=notifications" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 p-1 transition-colors hover:bg-slate-100 focus:outline-none dark:border-slate-700 dark:hover:bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "User"} />
                    <AvatarFallback className="bg-[#DCEEFF] text-xs font-semibold text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 lg:inline">
                    {user?.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-muted-foreground text-xs">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    onClick={() => navigate("/user/account")}
                    className="flex w-full cursor-pointer items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    {t("common.account")}
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex w-full cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div
          ref={handleContentRef}
          className={cn(
            "flex-1 overflow-hidden",
            typedActiveTab === "messenger" || typedActiveTab === "mentors"
              ? "p-0"
              : "overflow-auto p-6"
          )}>
          {outlet ?? renderContent()}
        </div>
        <ScrollToTopButton target={scrollTarget} threshold={600} hidden={shouldHideScrollButton} />
      </div>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
