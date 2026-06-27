import { LanguageToggle } from "@/components/LanguageToggle";
import type {
  ChromeTabMenuAction,
  ChromeTabMenuGroup,
  SidebarMenuGroup,
} from "@/components/shared";
import {
  DashboardChromeTabs,
  DashboardSidebar,
  DashboardSidebarToggle,
  getInitialSidebarCollapsed,
  SettingsModal,
  TabContentWrapper,
} from "@/components/shared";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { useTabsState, type Tab } from "@/hooks/useTabsState";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Star,
  Trash2,
  UserCheck,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ApplicationGradingDetailPage,
  ApplicationGradingPage,
} from "../../Admin/ApplicationGrading/ApplicationGradingPage";
import { FeedbackModerationPage } from "../FeedbackModeration";
import { MentorApplicationsPage } from "../MentorApplications";
import { PostModerationPage } from "../PostModeration";
import { ReviewModerationPage } from "../ReviewModeration";
import { SessionProcessingPage } from "../SessionProcessing";
import { StaffOverviewPage } from "./StaffOverviewPage";

type TabType =
  | "dashboard"
  | "mentorApplications"
  | "sessions"
  | "reviewModeration"
  | "feedbackModeration"
  | "postModeration"
  | "applicationGrading"
  | "grading-detail";

const VALID_TAB_TYPES: TabType[] = [
  "dashboard",
  "mentorApplications",
  "sessions",
  "reviewModeration",
  "feedbackModeration",
  "postModeration",
  "applicationGrading",
  "grading-detail",
];

const isValidTabType = (value: string): value is TabType => {
  return VALID_TAB_TYPES.includes(value as TabType);
};

const getAvailableTabs = (t: (key: string) => string): Array<{ type: TabType; label: string }> => [
  {
    type: "dashboard",
    label: t("common.dashboard"),
  },
  {
    type: "mentorApplications",
    label: t("staffStaffdashboard.browseMentors"),
  },
  {
    type: "sessions",
    label: t("common.interviewSession"),
  },
  {
    type: "applicationGrading",
    label: t("adminApplicationGrading.applicationGrading"),
  },
  {
    type: "reviewModeration",
    label: t("staffStaffdashboard.manageMentorReviews"),
  },
  {
    type: "feedbackModeration",
    label: t("staffStaffdashboard.manageCandidateFeedback"),
  },
  {
    type: "postModeration",
    label: t("common.articlesCommunity"),
  },
];

const TAB_ICONS: Record<TabType, React.ElementType> = {
  dashboard: LayoutDashboard,
  mentorApplications: UserCheck,
  sessions: Video,
  applicationGrading: ClipboardCheck,
  reviewModeration: Star,
  feedbackModeration: MessageSquare,
  postModeration: Newspaper,
  "grading-detail": FileText,
};

const TAB_COLORS: Record<TabType, string> = {
  dashboard: "text-green-600",
  mentorApplications: "text-green-600",
  sessions: "text-blue-600",
  applicationGrading: "text-orange-600",
  reviewModeration: "text-yellow-600",
  feedbackModeration: "text-cyan-600",
  postModeration: "text-purple-600",
  "grading-detail": "text-orange-600",
};

const getChromeTabsMenuGroups = (t: (key: string) => string): ChromeTabMenuGroup[] => [
  {
    items: [
      {
        type: "dashboard",
        label: t("common.dashboard"),
        icon: LayoutDashboard,
        iconColor: "text-green-600",
      },
    ],
  },
  {
    items: [
      {
        type: "mentorApplications",
        label: t("staffStaffdashboard.browseMentors"),
        icon: UserCheck,
        iconColor: "text-green-600",
      },
      {
        type: "sessions",
        label: t("common.interviewSession"),
        icon: Video,
        iconColor: "text-blue-600",
      },
      {
        type: "applicationGrading",
        label: t("adminApplicationGrading.applicationGrading"),
        icon: ClipboardCheck,
        iconColor: "text-orange-600",
      },
    ],
  },
  {
    items: [
      {
        type: "reviewModeration",
        label: t("staffStaffdashboard.manageMentorReviews"),
        icon: Star,
        iconColor: "text-yellow-600",
      },
      {
        type: "feedbackModeration",
        label: t("staffStaffdashboard.manageCandidateFeedback"),
        icon: MessageSquare,
        iconColor: "text-cyan-600",
      },
      {
        type: "postModeration",
        label: t("common.articlesCommunity"),
        icon: Newspaper,
        iconColor: "text-purple-600",
      },
    ],
  },
];

const getSidebarMenuGroups = (t: (key: string) => string): SidebarMenuGroup[] => [
  {
    items: [
      {
        type: "dashboard",
        icon: LayoutDashboard,
        label: t("common.dashboard"),
        color: "text-green-600",
      },
    ],
  },
  {
    items: [
      {
        type: "mentorApplications",
        icon: UserCheck,
        label: t("staffStaffdashboard.browseMentors"),
        color: "text-green-600",
        description: t("staffStaffdashboard.processMentorRegistration"),
      },
      {
        type: "sessions",
        icon: Video,
        label: t("common.interviewSession"),
        color: "text-blue-600",
        description: t("common.manageInterviewSessions"),
      },
      {
        type: "applicationGrading",
        icon: ClipboardCheck,
        label: t("adminApplicationGrading.applicationGrading"),
        color: "text-orange-600",
        description: t("adminApplicationGrading.gradeApplications"),
      },
    ],
  },
  {
    items: [
      {
        type: "reviewModeration",
        icon: Star,
        label: t("staffStaffdashboard.mentorSReview"),
        color: "text-yellow-600",
        description: t("staffStaffdashboard.moderateTheMentorSAssessment"),
      },
      {
        type: "feedbackModeration",
        icon: MessageSquare,
        label: t("staffStaffdashboard.candidateResponses"),
        color: "text-cyan-600",
        description: t("staffStaffdashboard.moderateCandidatesResponsesToMentors"),
      },
      {
        type: "postModeration",
        icon: Newspaper,
        label: t("common.article"),
        color: "text-purple-600",
        description: t("staffStaffdashboard.postModeration"),
      },
    ],
  },
];

const validateChromeTabsMenuConfiguration = (
  availableTabs: Array<{ type: TabType; label: string }>,
  chromeTabsMenuGroups: ChromeTabMenuGroup[]
) => {
  const availableTabTypes = new Set(availableTabs.map((tab) => tab.type));
  const menuTabTypes = new Set(
    chromeTabsMenuGroups.flatMap((group) => group.items.map((item) => item.type as TabType))
  );
  const missingInMenu = availableTabs
    .filter((tab) => !menuTabTypes.has(tab.type))
    .map((tab) => tab.type);
  const invalidInMenu = Array.from(menuTabTypes).filter((type) => !availableTabTypes.has(type));
  return {
    missingInMenu,
    invalidInMenu,
  };
};

export function StaffDashboardPage() {
  const { t } = useTranslation();
  const STAFF_SIDEBAR_LOGO = useMemo(
    () => (
      <>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {t("staffStaffdashboard.staffPanel")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t("staffStaffdashboard.staffAdministration")}
          </p>
        </div>
      </>
    ),
    [t]
  );
  const STAFF_SIDEBAR_LOGO_COLLAPSED = useMemo(
    () => (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600">
        <LayoutDashboard className="h-6 w-6 text-white" />
      </div>
    ),
    []
  );
  const sidebarBehavior = useSettingsStore((state) => state.sidebarBehavior);
  const availableTabs = useMemo(() => getAvailableTabs(t), [t]);
  const sidebarMenuGroups = useMemo(() => getSidebarMenuGroups(t), [t]);
  const chromeTabsMenuGroups = useMemo(() => getChromeTabsMenuGroups(t), [t]);
  const {
    activeTab,
    openTabs,
    setActiveTab,
    closeTab,
    resetTabsTo,
    closeOtherTabs,
    openGradingTab,
  } = useTabsState({
    storageKey: "staff",
    defaultTab: "dashboard",
    availableTabs: availableTabs,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchEntries = Object.fromEntries(searchParams.entries());
  const { appId: gradingAppId, detailId: gradingDetailId } = searchEntries;
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollTarget, setScrollTarget] = useState<HTMLDivElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getInitialSidebarCollapsed(
      "staff_sidebar_collapsed",
      undefined,
      sidebarBehavior === "auto-collapse"
    )
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const typedActiveTab = activeTab as TabType;

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    const { missingInMenu, invalidInMenu } = validateChromeTabsMenuConfiguration(
      availableTabs,
      chromeTabsMenuGroups
    );
    if (missingInMenu.length === 0 && invalidInMenu.length === 0) {
      return;
    }
    console.warn(t("staffStaffdashboard.admindashboardpageThePlusTabMenu"), {
      missingInMenu,
      invalidInMenu,
    });
  }, [t, availableTabs, chromeTabsMenuGroups]);

  useEffect(() => {
    setIsSidebarCollapsed(sidebarBehavior === "auto-collapse");
  }, [sidebarBehavior]);

  const chromeTabsData = useMemo(() => {
    const result = openTabs
      .filter((tab) => tab.type === "grading-detail" || isValidTabType(tab.type))
      .map((tab) => ({
        id: tab.id,
        type: tab.type,
        title: tab.label,
        appId: (tab as Tab).appId,
      }));
    return result;
  }, [openTabs]);

  const activeTabId = useMemo(() => {
    // For grading-detail tabs, match by type AND appId from URL
    if (activeTab === "grading-detail") {
      const tab = openTabs.find((t) => t.type === "grading-detail" && t.appId === gradingAppId);
      return tab?.id || "";
    }
    const activeTabData = openTabs.find((tab) => tab.type === activeTab);
    return activeTabData?.id || "";
  }, [openTabs, activeTab, gradingAppId]);

  const navigateToTab = useCallback(
    (tabType: string) => {
      // Prevent opening grading-detail tab without detailId or appId (would show blank page)
      if (
        tabType === "grading-detail" &&
        !searchParams.get("detailId") &&
        !searchParams.get("appId")
      ) {
        toast.error("Vui lòng chọn một đơn ứng tuyển cụ thể từ danh sách");
        navigate("/staff?tab=applicationGrading", { replace: true });
        return;
      }
      setActiveTab(tabType, true);
      navigate(`/staff?tab=${tabType}`, { replace: true });
    },
    [navigate, setActiveTab, searchParams]
  );

  const handleTabSelect = useCallback(
    (tabId: string) => {
      const selectedTab = openTabs.find((tab) => tab.id === tabId);
      if (!selectedTab) return;
      // For grading-detail tabs, navigate with detailId or appId
      if (selectedTab.type === "grading-detail") {
        const detailId = (selectedTab as Tab).detailId;
        const appId = (selectedTab as Tab).appId;
        const params = new URLSearchParams({ tab: "grading-detail" });
        if (detailId) {
          params.set("detailId", String(detailId));
        } else if (appId) {
          params.set("appId", String(appId));
        }
        navigate(`/staff?${params.toString()}`, { replace: true });
        setActiveTab("grading-detail", true);
        return;
      }
      navigateToTab(selectedTab.type);
    },
    [navigateToTab, openTabs, navigate, setActiveTab]
  );

  const handleNewTab = useCallback(
    (type: string) => {
      navigateToTab(type);
    },
    [navigateToTab]
  );

  const handleSidebarNavigate = useCallback(
    (type: string) => {
      navigateToTab(type);
    },
    [navigateToTab]
  );

  const handleCloseAllTabs = useCallback(() => {
    resetTabsTo("dashboard", true);
  }, [resetTabsTo]);

  const handleCloseOtherTabs = useCallback(
    (tabId: string) => {
      const targetTab = openTabs.find((t) => t.id === tabId);
      if (!targetTab) return;
      if (targetTab.type !== activeTab) {
        navigateToTab(targetTab.type);
      }
      closeOtherTabs(tabId);
    },
    [openTabs, navigateToTab, activeTab, closeOtherTabs]
  );

  const closeAllDisabled = openTabs.length === 1 && openTabs[0]?.type === "dashboard";
  const chromeMenuActions = useMemo<ChromeTabMenuAction[]>(
    () => [
      {
        id: "close-all-tabs",
        label: t("common.closeAllTabs"),
        icon: Trash2,
        destructive: true,
        disabled: closeAllDisabled,
        onSelect: handleCloseAllTabs,
      },
    ],
    [closeAllDisabled, handleCloseAllTabs, t]
  );

  const renderTabContent = (tabType: string) => {
    switch (tabType) {
      case "dashboard":
        return <StaffOverviewPage />;
      case "mentorApplications":
        return <MentorApplicationsPage />;
      case "sessions":
        return <SessionProcessingPage />;
      case "applicationGrading":
        return <ApplicationGradingPage onOpenGradingDetail={openGradingTab} basePath="/staff" />;
      case "grading-detail":
        return (
          <ApplicationGradingDetailPage appId={gradingDetailId ?? gradingAppId} basePath="/staff" />
        );
      case "reviewModeration":
        return <ReviewModerationPage />;
      case "feedbackModeration":
        return <FeedbackModerationPage />;
      case "postModeration":
        return <PostModerationPage />;
      default:
        return <div>{t("common.invalidTabType")}</div>;
    }
  };

  const handleContentRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
  }, []);

  return (
    <div className="isolate flex h-screen bg-gray-50 dark:bg-slate-950">
      <DashboardSidebar
        menuGroups={sidebarMenuGroups}
        activeTab={typedActiveTab}
        onNavigate={handleSidebarNavigate}
        storageKey="staff_sidebar_collapsed"
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        showDesktopToggle={false}
        logo={STAFF_SIDEBAR_LOGO}
        collapsedLogo={STAFF_SIDEBAR_LOGO_COLLAPSED}
        showSettings
        settingsLabel={t("common.setting")}
        onSettingsClick={() => setIsSettingsOpen(true)}
        theme={{
          wrapper:
            "h-full border-r border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900",
          expandedWidth: "w-56",
          collapsedWidth: "w-16",
          logoBorder: "border-b border-gray-200 dark:border-slate-800",
          logoExpandedPadding: "h-14 gap-3 px-4",
          logoCollapsedPadding: "h-14 justify-center px-2",
          navWrapper: "flex-1 space-y-1 overflow-y-auto",
          navExpandedPadding: "p-2 pt-4",
          navCollapsedPadding: "p-2",
          sectionLabel:
            "text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400",
          divider: "",
          itemPy: "py-2",
          activeItem: "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white",
          inactiveItem:
            "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
          footerBorder: "border-t border-gray-200 dark:border-slate-800",
          footerExpandedPadding: "p-4",
          footerCollapsedPadding: "p-2",
          logoutExpandedBtn:
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
          logoutCollapsedBtn:
            "flex items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
          logoutIcon: "",
          logoutLabel: t("common.logout"),
        }}
      />

      <div className="relative z-0 flex flex-1 flex-col overflow-x-hidden">
        <DashboardChromeTabs
          tabs={chromeTabsData}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={closeTab}
          onCloseOtherTabs={handleCloseOtherTabs}
          onCloseAllTabs={handleCloseAllTabs}
          onNewTab={handleNewTab}
          leftSlot={
            <DashboardSidebarToggle
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden h-7 w-7 rounded-full border border-slate-300/85 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 md:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            />
          }
          tabIcons={TAB_ICONS}
          tabColors={TAB_COLORS}
          menuGroups={chromeTabsMenuGroups}
          menuActions={chromeMenuActions}
          rightSlot={<LanguageToggle />}
          theme={{
            bg: "bg-gray-100 dark:bg-slate-800",
            tabActiveBorder: "border-gray-300 dark:border-slate-600",
            tabActiveBg: "bg-white dark:bg-slate-900",
            tabInactiveBg: "bg-gray-200 dark:bg-slate-700",
            tabInactiveHover: "hover:bg-gray-100 dark:hover:bg-slate-600",
            closeHover: "hover:bg-gray-300 dark:hover:bg-slate-500",
            addBtnBg: "bg-gray-200 dark:bg-slate-700",
            addBtnHover: "hover:bg-gray-300 dark:hover:bg-slate-500",
            menuHover: "hover:bg-gray-100 dark:hover:bg-slate-600",
          }}
        />

        <div ref={handleContentRef} className="relative flex-1 overflow-hidden">
          {chromeTabsData.map((tab) => {
            const isTabActive = tab.id === activeTabId;
            return (
              <TabContentWrapper
                key={tab.id}
                tabId={tab.id}
                tabType={tab.type}
                isActive={isTabActive}
                onScrollTargetActive={setScrollTarget}>
                {renderTabContent(tab.type)}
              </TabContentWrapper>
            );
          })}
        </div>
        <ScrollToTopButton target={scrollTarget} threshold={600} />
      </div>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
