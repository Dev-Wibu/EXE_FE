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
import { useDashboardBreadcrumb } from "@/hooks/useDashboardBreadcrumb";
import { useDashboardScrollRestoration } from "@/hooks/useDashboardScrollRestoration";
import { useTabsState } from "@/hooks/useTabsState";
import { getDashboardTabFromPath } from "@/lib/dashboard-breadcrumb";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Star,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { MentorAccountPage } from "../Account";
import { GivenFeedbackListPage } from "../Feedback";
import { MentorHomeFeedPage } from "../HomeFeed";
import { MessengerPage } from "../Messenger";
import { MentorNotificationsPage } from "../Notifications";
import { MentorOverviewPage } from "../Overview";
import { MentorReviewsPage } from "../Reviews";
import { MentorSessionsPage } from "../Sessions";
import { StudentsListPage } from "../Students";
const t = i18n.t.bind(i18n);
type TabType =
  | "homeFeed"
  | "overview"
  | "sessions"
  | "students"
  | "reviews"
  | "feedback"
  | "notifications"
  | "messenger"
  | "account";

const VALID_TAB_TYPES: TabType[] = [
  "homeFeed",
  "overview",
  "sessions",
  "students",
  "reviews",
  "feedback",
  "notifications",
  "messenger",
  "account",
];

const isValidTabType = (value: string): value is TabType => {
  return VALID_TAB_TYPES.includes(value as TabType);
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
    type: "sessions",
    label: t("common.interviewSession"),
  },
  {
    type: "students",
    label: t("common.students"),
  },
  {
    type: "reviews",
    label: t("mentorMentordashboard.reviewSent"),
  },
  {
    type: "feedback",
    label: t("common.responseReceived"),
  },
  {
    type: "notifications",
    label: t("common.notification"),
  },
  {
    type: "messenger",
    label: t("common.messages"),
  },
  {
    type: "account",
    label: t("common.account"),
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
    label: t("common.profession"),
    items: [
      {
        type: "overview",
        icon: LayoutDashboard,
        label: t("common.overview"),
        color: "text-emerald-600",
      },
      {
        type: "sessions",
        icon: Calendar,
        label: t("common.interviewSession"),
        color: "text-blue-600",
      },
      {
        type: "students",
        icon: Users,
        label: t("common.students"),
        color: "text-purple-600",
      },
      {
        type: "reviews",
        icon: Star,
        label: t("mentorMentordashboard.reviewSent"),
        color: "text-yellow-600",
      },
      {
        type: "feedback",
        icon: MessageSquare,
        label: t("common.responseReceived"),
        color: "text-cyan-600",
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
        color: "text-emerald-500",
      },
      {
        type: "account",
        icon: User,
        label: t("common.account"),
        color: "text-gray-600",
      },
    ],
  },
];
const MENTOR_SIDEBAR_LOGO = (
  <>
    <img src={icon2} alt="INBLUE AI" className="h-9 w-9 shrink-0" />
    <div className="flex flex-col">
      <span className="text-lg font-bold text-emerald-700 dark:text-white">INBLUE AI</span>
      <span className="text-xs text-emerald-600 dark:text-emerald-400">
        {t("mentorMentordashboard.mentorGate")}
      </span>
    </div>
  </>
);
const MENTOR_SIDEBAR_LOGO_COLLAPSED = (
  <img src={icon2} alt="INBLUE AI" className="h-9 w-9 shrink-0" />
);
const DEFAULT_TAB: TabType = "overview";
export function MentorDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarBehavior = useSettingsStore((state) => state.sidebarBehavior);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollTarget, setScrollTarget] = useState<HTMLDivElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getInitialSidebarCollapsed(
      "mentor_dashboard_sidebar_collapsed",
      undefined,
      sidebarBehavior === "auto-collapse"
    )
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const availableTabs = useMemo(() => getAvailableTabs(t), [t]);
  const sidebarMenuGroups = useMemo(() => getSidebarMenuGroups(t), [t]);
  const { activeTab, openTab } = useTabsState({
    storageKey: "mentor",
    defaultTab: DEFAULT_TAB,
    availableTabs: availableTabs,
  });
  const outlet = useOutlet();
  const routedTab = getDashboardTabFromPath({
    role: "mentor",
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
    role: "mentor",
    pathname: location.pathname,
    activeTab: typedActiveTab,
    availableTabs: availableTabs,
  });
  const shouldHideScrollButton = location.pathname.startsWith("/mentor/sessions/room/");
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
        navigate(`/mentor?tab=${type}`);
      } else {
        openTab(type);
      }
    },
    [outlet, openTab, navigate]
  );
  const renderContent = () => {
    switch (typedActiveTab) {
      case "homeFeed":
        return <MentorHomeFeedPage />;
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
      case "messenger":
        return <MessengerPage />;
      case "account":
        return <MentorAccountPage />;
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
        storageKey="mentor_dashboard_sidebar_collapsed"
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        showDesktopToggle={false}
        logo={MENTOR_SIDEBAR_LOGO}
        collapsedLogo={MENTOR_SIDEBAR_LOGO_COLLAPSED}
        showSettings
        settingsLabel={t("common.setting")}
        onSettingsClick={() => setIsSettingsOpen(true)}
        theme={{
          wrapper: "h-screen border-r border-emerald-200 bg-emerald-50/50",
          expandedWidth: "w-56",
          collapsedWidth: "w-16",
          logoBorder: "border-b border-emerald-200",
          logoExpandedPadding: "h-14 gap-2 px-4",
          logoCollapsedPadding: "h-14 justify-center px-2",
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
          footerBorder: "border-t border-emerald-200",
          footerExpandedPadding: "p-3",
          footerCollapsedPadding: "p-2",
          logoutExpandedBtn:
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutCollapsedBtn:
            "flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          logoutIcon: "text-slate-500 dark:text-slate-400",
          logoutLabel: t("common.logout"),
        }}
      />

      <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
        <div className="relative z-60 flex h-14 items-center justify-between border-b border-emerald-200 bg-white pr-4 pl-16 md:px-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="hidden shrink-0 pr-2 md:flex">
            <DashboardSidebarToggle
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          </div>
          <DashboardBreadcrumb items={breadcrumbItems} className="min-w-0 flex-1" />
          <div className="shrink-0 pl-3">
            <NotificationBell notificationsPath="/mentor?tab=notifications" />
          </div>
        </div>
        <div
          ref={handleContentRef}
          className={cn(
            "flex-1 overflow-hidden",
            typedActiveTab === "messenger" ? "p-0" : "overflow-auto p-6"
          )}>
          {outlet ?? renderContent()}
        </div>
        <ScrollToTopButton target={scrollTarget} threshold={600} hidden={shouldHideScrollButton} />
      </div>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
