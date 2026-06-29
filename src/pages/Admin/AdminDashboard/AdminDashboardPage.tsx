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
import { AdminGradingTabProvider } from "@/contexts/AdminGradingTabContext";
import { useTabsState, type Tab } from "@/hooks/useTabsState";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Bell,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  ClipboardCheck,
  Code2,
  Database,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  MessageSquare,
  Newspaper,
  Settings,
  Star,
  Trash2,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ApplicationGradingDetailPage,
  ApplicationGradingPage,
} from "../ApplicationGrading/ApplicationGradingPage";
import { CandidateProfileManagementPage } from "../CandidateProfileManagement";
import { CodeReviewProblemManagementPage } from "../CodeReviewProblemManagement";
import { CompanyManagementPage } from "../CompanyManagement";
import { DashboardOverviewPage } from "../DashboardOverview";
import { FeedbackManagementPage } from "../FeedbackManagement";
import { InterviewTemplateManagementPage } from "../InterviewTemplateManagement/InterviewTemplateManagementPage";
import { MentorManagementPage } from "../MentorManagement";
import { NotificationManagementPage } from "../NotificationManagement";
import { PostManagementPage } from "../PostManagement";
import { PracticeQuestionManagementPage } from "../PracticeQuestionManagement";
import { PracticeSetManagementPage } from "../PracticeSetManagement";
import { QuestionBankManagementPage } from "../QuestionBankManagement";
import { QuestionMajorManagementPage } from "../QuestionMajorManagement";
import { ReviewManagementPage } from "../ReviewManagement";
import { SessionManagementPage } from "../SessionManagement";
import { UserManagementPage } from "../UserManagement";
type TabType =
  | "dashboard"
  | "users"
  | "mentors"
  | "sessions"
  | "reviews"
  | "feedback"
  | "notifications"
  | "questionBanks"
  | "questionMajors"
  | "practiceSets"
  | "practiceQuestions"
  | "posts"
  | "companies"
  | "candidateProfiles"
  | "interviewTemplates"
  | "applicationGrading"
  | "grading-detail"
  | "gradingTemplates"
  | "practiceExam"
  | "codeReviewProblems";

const VALID_TAB_TYPES: TabType[] = [
  "dashboard",
  "users",
  "mentors",
  "sessions",
  "reviews",
  "feedback",
  "notifications",
  "questionBanks",
  "questionMajors",
  "practiceSets",
  "practiceQuestions",
  "posts",
  "companies",
  "candidateProfiles",
  "interviewTemplates",
  "applicationGrading",
  "grading-detail",
  "gradingTemplates",
  "practiceExam",
  "codeReviewProblems",
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
    type: "dashboard",
    label: t("common.dashboard"),
  },
  {
    type: "users",
    label: t("common.userManagement"),
  },
  {
    type: "mentors",
    label: t("common.mentorManagement"),
  },
  {
    type: "sessions",
    label: t("common.manageInterviewSessions"),
  },
  {
    type: "reviews",
    label: t("adminAdmindashboard.manageSentMentorReviews"),
  },
  {
    type: "feedback",
    label: t("adminAdmindashboard.manageResponsesSentByCandidates"),
  },
  {
    type: "notifications",
    label: t("adminAdmindashboard.manageNotifications"),
  },
  {
    type: "questionBanks",
    label: t("common.questionBank"),
  },
  {
    type: "questionMajors",
    label: t("common.specialized"),
  },
  {
    type: "practiceSets",
    label: t("adminAdmindashboard.reviewSet"),
  },
  {
    type: "practiceQuestions",
    label: t("adminAdmindashboard.reviewQuestions"),
  },
  {
    type: "posts",
    label: t("common.articlesCommunity"),
  },
  {
    type: "companies",
    label: t("adminAdmindashboard.companyManagement"),
  },
  {
    type: "candidateProfiles",
    label: t("common.candidateProfile"),
  },
  {
    type: "interviewTemplates",
    label: t("adminAdmindashboard.processTemplate"),
  },
  {
    type: "applicationGrading",
    label: t("adminAdmindashboard.candidateGrading"),
  },
  {
    type: "grading-detail",
    label: t("grading.details"),
  },
  {
    type: "gradingTemplates",
    label: t("grading.template"),
  },
  {
    type: "practiceExam",
    label: t("quiz.practiceTest"),
  },
  {
    type: "codeReviewProblems",
    label: "Code Review Problems",
  },
];
const TAB_ICONS: Record<TabType, React.ElementType> = {
  dashboard: LayoutDashboard,
  users: Users,
  mentors: UserCog,
  sessions: Video,
  reviews: Star,
  feedback: MessageSquare,
  notifications: Bell,
  questionBanks: Database,
  questionMajors: GraduationCap,
  practiceSets: BookOpen,
  practiceQuestions: FileQuestion,
  posts: Newspaper,
  companies: Building2,
  candidateProfiles: FileText,
  interviewTemplates: LayoutTemplate,
  applicationGrading: ClipboardCheck,
  gradingTemplates: ClipboardCheck,
  practiceExam: ClipboardCheck,
  "grading-detail": ClipboardCheck,
  codeReviewProblems: Code2,
};
const TAB_COLORS: Record<TabType, string> = {
  dashboard: "text-indigo-600",
  users: "text-blue-600",
  mentors: "text-orange-600",
  sessions: "text-green-600",
  reviews: "text-yellow-600",
  feedback: "text-cyan-600",
  notifications: "text-red-600",
  questionBanks: "text-indigo-500",
  questionMajors: "text-pink-600",
  practiceSets: "text-teal-600",
  practiceQuestions: "text-emerald-600",
  posts: "text-purple-500",
  companies: "text-sky-600",
  candidateProfiles: "text-teal-600",
  interviewTemplates: "text-violet-600",
  applicationGrading: "text-rose-600",
  gradingTemplates: "text-rose-600",
  practiceExam: "text-rose-600",
  "grading-detail": "text-rose-600",
  codeReviewProblems: "text-violet-600",
};
const getChromeTabsMenuGroups = (t: (key: string) => string): ChromeTabMenuGroup[] => [
  {
    items: [
      {
        type: "dashboard",
        label: t("common.dashboard"),
        icon: LayoutDashboard,
        iconColor: "text-indigo-600",
      },
    ],
  },
  {
    items: [
      {
        type: "users",
        label: t("common.userManagement"),
        icon: Users,
        iconColor: "text-blue-600",
      },
      {
        type: "mentors",
        label: t("common.mentorManagement"),
        icon: UserCog,
        iconColor: "text-orange-600",
      },
      {
        type: "companies",
        label: t("adminAdmindashboard.companyManagement"),
        icon: Building2,
        iconColor: "text-sky-600",
      },
      {
        type: "notifications",
        label: t("adminAdmindashboard.manageNotifications"),
        icon: Bell,
        iconColor: "text-red-600",
      },
    ],
  },
  {
    items: [
      {
        type: "sessions",
        label: t("common.manageInterviewSessions"),
        icon: Video,
        iconColor: "text-green-600",
      },
      {
        type: "interviewTemplates",
        label: t("adminAdmindashboard.processTemplate"),
        icon: LayoutTemplate,
        iconColor: "text-violet-600",
      },
      {
        type: "candidateProfiles",
        label: t("common.candidateProfile"),
        icon: FileText,
        iconColor: "text-teal-600",
      },
      {
        type: "reviews",
        label: t("adminAdmindashboard.manageSentMentorReviews"),
        icon: Star,
        iconColor: "text-yellow-600",
      },
      {
        type: "feedback",
        label: t("adminAdmindashboard.manageResponsesSentByCandidates"),
        icon: MessageSquare,
        iconColor: "text-cyan-600",
      },
      {
        type: "applicationGrading",
        label: t("adminAdmindashboard.candidateGrading"),
        icon: ClipboardCheck,
        iconColor: "text-rose-600",
      },
    ],
  },
  {
    items: [
      {
        type: "questionBanks",
        label: t("common.questionBank"),
        icon: Database,
        iconColor: "text-indigo-500",
      },
      {
        type: "codeReviewProblems",
        label: "Code Review Problems",
        icon: Code2,
        iconColor: "text-violet-600",
      },
    ],
  },
  {
    items: [
      {
        type: "posts",
        label: t("common.articlesCommunity"),
        icon: Newspaper,
        iconColor: "text-purple-500",
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
        color: "text-indigo-600",
      },
      {
        type: "system",
        icon: Settings,
        label: t("adminAdmindashboard.administration"),
        color: "text-blue-600",
        children: [
          { type: "users", icon: Users, label: t("common.user"), color: "text-blue-600" },
          {
            type: "mentors",
            icon: UserCog,
            label: t("adminAdmindashboard.instructor"),
            color: "text-orange-600",
          },
          { type: "companies", icon: Building2, label: t("common.company"), color: "text-sky-600" },
          {
            type: "notifications",
            icon: Bell,
            label: t("common.notification"),
            color: "text-red-600",
          },
        ],
      },
      {
        type: "recruitment",
        icon: Briefcase,
        label: t("adminAdmindashboard.recruitment"),
        color: "text-emerald-600",
        children: [
          {
            type: "sessions",
            icon: Video,
            label: t("common.interviewSession"),
            color: "text-green-600",
          },
          {
            type: "interviewTemplates",
            icon: LayoutTemplate,
            label: t("adminAdmindashboard.processTemplate"),
            color: "text-violet-600",
          },
          {
            type: "candidateProfiles",
            icon: FileText,
            label: t("common.candidateProfile"),
            color: "text-teal-600",
          },
          {
            type: "reviews",
            icon: Star,
            label: t("common.reviewFromMentor"),
            color: "text-yellow-600",
          },
          {
            type: "feedback",
            icon: MessageSquare,
            label: t("common.feedbackFromCandidates"),
            color: "text-cyan-600",
          },
          {
            type: "applicationGrading",
            icon: ClipboardCheck,
            label: t("adminAdmindashboard.candidateGrading"),
            color: "text-rose-600",
          },
        ],
      },
      {
        type: "testing",
        icon: BrainCircuit,
        label: t("adminAdmindashboard.testingAndTraining"),
        color: "text-purple-600",
        children: [
          {
            type: "questionBanks",
            icon: Database,
            label: t("common.questionBank"),
            color: "text-indigo-500",
          },
          {
            type: "codeReviewProblems",
            icon: Code2,
            label: "Code Review Problems",
            color: "text-violet-600",
          },
        ],
      },
      {
        type: "content",
        icon: Library,
        label: t("common.content"),
        color: "text-pink-500",
        children: [
          {
            type: "posts",
            icon: Newspaper,
            label: t("common.articlesCommunity"),
            color: "text-purple-500",
          },
        ],
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
export function AdminDashboardPage() {
  const { t } = useTranslation();
  const ADMIN_SIDEBAR_LOGO = useMemo(
    () => (
      <>
        <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {t("adminAdmindashboard.administrator")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t("adminAdmindashboard.systemAdministration")}
          </p>
        </div>
      </>
    ),
    [t]
  );
  const ADMIN_SIDEBAR_LOGO_COLLAPSED = useMemo(
    () => (
      <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <LayoutDashboard className="h-6 w-6 text-white" />
      </div>
    ),
    []
  );
  const navigate = useNavigate();
  const { companyId } = useParams();
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
    storageKey: "admin",
    defaultTab: "dashboard",
    availableTabs: availableTabs,
  });
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollTarget, setScrollTarget] = useState<HTMLDivElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    getInitialSidebarCollapsed(
      "admin_sidebar_collapsed",
      "manager_sidebar_collapsed",
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
    console.warn(t("adminAdmindashboard.admindashboardpageThePlusTabMenu"), {
      missingInMenu,
      invalidInMenu,
    });
  }, [t, availableTabs, chromeTabsMenuGroups]);
  useEffect(() => {
    setIsSidebarCollapsed(sidebarBehavior === "auto-collapse");
  }, [sidebarBehavior]);
  const { appId: gradingAppId } = Object.fromEntries(searchParams.entries());

  const chromeTabsData = useMemo(() => {
    console.log("[DEBUG chromeTabsData] openTabs:", JSON.stringify(openTabs));
    const result = openTabs
      .filter((tab) => tab.type === "grading-detail" || isValidTabType(tab.type))
      .map((tab) => ({
        id: tab.id,
        type: tab.type,
        title: tab.label,
        appId: (tab as Tab).appId,
      }));
    console.log("[DEBUG chromeTabsData] result:", JSON.stringify(result));
    console.log(
      "[DEBUG chromeTabsData] activeTab:",
      activeTab,
      "activeTabId will be:",
      result.find((t) => t.type === activeTab)?.id || "not found"
    );
    return result;
  }, [openTabs, activeTab]);

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
      // Prevent opening grading-detail tab without appId (would show blank page)
      if (tabType === "grading-detail" && !searchParams.get("appId")) {
        toast.error(t("application.selectFromList"));
        navigate("/admin?tab=applicationGrading", { replace: true });
        return;
      }
      if (companyId && tabType !== "companies") {
        navigate(`/admin?tab=${tabType}`, {
          replace: true,
        });
        setActiveTab(tabType, true);
      } else {
        setActiveTab(tabType);
      }
    },
    [companyId, navigate, setActiveTab, searchParams]
  );
  const handleTabSelect = useCallback(
    (tabId: string) => {
      const selectedTab = openTabs.find((tab) => tab.id === tabId);
      if (!selectedTab) return;
      // For grading-detail tabs, navigate with appId
      if (selectedTab.type === "grading-detail") {
        const appId = (selectedTab as Tab).appId;
        if (appId) {
          navigate(`/admin?tab=grading-detail&appId=${appId}`, { replace: true });
          setActiveTab("grading-detail", true);
        }
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
    if (companyId) {
      navigate("/admin?tab=dashboard", {
        replace: true,
      });
      resetTabsTo("dashboard", true);
    } else {
      resetTabsTo("dashboard");
    }
  }, [companyId, navigate, resetTabsTo]);
  const handleCloseOtherTabs = useCallback(
    (tabId: string) => {
      const targetTab = openTabs.find((t) => t.id === tabId);
      if (!targetTab) return;

      if (companyId && targetTab.type !== "companies") {
        navigate(`/admin?tab=${targetTab.type}`, {
          replace: true,
        });
      } else if (targetTab.type !== activeTab) {
        navigateToTab(targetTab.type);
      }
      closeOtherTabs(tabId);
    },
    [openTabs, companyId, navigate, activeTab, navigateToTab, closeOtherTabs]
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

  const renderTabContent = (tabType: string, isTabActive: boolean) => {
    console.log("[DEBUG renderTabContent]", {
      tabType,
      isTabActive,
      gradingAppId,
      chromeTabsData: chromeTabsData.map((t) => ({ id: t.id, type: t.type })),
    });
    switch (tabType) {
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
      case "questionBanks":
        return <QuestionBankManagementPage />;
      case "questionMajors":
        return <QuestionMajorManagementPage />;
      case "practiceSets":
        return <PracticeSetManagementPage />;
      case "practiceQuestions":
        return <PracticeQuestionManagementPage />;
      case "posts":
        return <PostManagementPage />;
      case "companies":
        return <CompanyManagementPage isActive={isTabActive} />;
      case "candidateProfiles":
        return <CandidateProfileManagementPage />;
      case "interviewTemplates":
        return <InterviewTemplateManagementPage />;
      case "applicationGrading":
        return <ApplicationGradingPage onOpenGradingDetail={openGradingTab} />;
      case "grading-detail":
        return <ApplicationGradingDetailPage appId={gradingAppId} />;
      case "codeReviewProblems":
        return <CodeReviewProblemManagementPage />;
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
        storageKey="admin_sidebar_collapsed"
        legacyStorageKey="manager_sidebar_collapsed"
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        showDesktopToggle={false}
        logo={ADMIN_SIDEBAR_LOGO}
        collapsedLogo={ADMIN_SIDEBAR_LOGO_COLLAPSED}
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
          <AdminGradingTabProvider openGradingTab={openGradingTab}>
            {chromeTabsData.map((tab) => {
              const isTabActive = tab.id === activeTabId;
              return (
                <TabContentWrapper
                  key={tab.id}
                  tabId={tab.id}
                  tabType={tab.type}
                  isActive={isTabActive}
                  onScrollTargetActive={setScrollTarget}>
                  {renderTabContent(tab.type, isTabActive)}
                </TabContentWrapper>
              );
            })}
          </AdminGradingTabProvider>
        </div>
        <ScrollToTopButton target={scrollTarget} threshold={600} />
      </div>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
