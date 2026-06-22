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
import { useTabsState } from "@/hooks/useTabsState";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Bell,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Database,
  FileQuestion,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  MessageSquare,
  Newspaper,
  Settings,
  Star,
  Trash2,
  Trophy,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { CandidateProfileManagementPage } from "../CandidateProfileManagement";
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
import { QuestionCategoryManagementPage } from "../QuestionCategoryManagement/QuestionCategoryManagementPage";
import { QuestionMajorManagementPage } from "../QuestionMajorManagement";
import { QuizSetManagementPage } from "../QuizSetManagement";
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
  | "questionCategories"
  | "questionBanks"
  | "questionMajors"
  | "practiceSets"
  | "practiceQuestions"
  | "quizSets"
  | "posts"
  | "companies"
  | "candidateProfiles"
  | "interviewTemplates";

const VALID_TAB_TYPES: TabType[] = [
  "dashboard",
  "users",
  "mentors",
  "sessions",
  "reviews",
  "feedback",
  "notifications",
  "questionCategories",
  "questionBanks",
  "questionMajors",
  "practiceSets",
  "practiceQuestions",
  "quizSets",
  "posts",
  "companies",
  "candidateProfiles",
  "interviewTemplates",
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
    type: "questionCategories",
    label: t("common.lesson"),
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
    type: "quizSets",
    label: t("adminAdmindashboard.testSet"),
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
    label: "Mẫu quy trình",
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
  questionCategories: FolderOpen,
  questionBanks: Database,
  questionMajors: GraduationCap,
  practiceSets: BookOpen,
  practiceQuestions: FileQuestion,
  quizSets: Trophy,
  posts: Newspaper,
  companies: Building2,
  candidateProfiles: FileText,
  interviewTemplates: LayoutTemplate,
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
  questionBanks: "text-indigo-500",
  questionMajors: "text-pink-600",
  practiceSets: "text-teal-600",
  practiceQuestions: "text-emerald-600",
  quizSets: "text-amber-600",
  posts: "text-purple-500",
  companies: "text-sky-600",
  candidateProfiles: "text-teal-600",
  interviewTemplates: "text-violet-600",
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
        label: "Mẫu quy trình",
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
        type: "questionMajors",
        label: t("common.specialized"),
        icon: GraduationCap,
        iconColor: "text-pink-600",
      },
      {
        type: "practiceSets",
        label: t("adminAdmindashboard.reviewSet"),
        icon: BookOpen,
        iconColor: "text-teal-600",
      },
      {
        type: "practiceQuestions",
        label: t("adminAdmindashboard.reviewQuestions"),
        icon: FileQuestion,
        iconColor: "text-emerald-600",
      },
      {
        type: "quizSets",
        label: t("adminAdmindashboard.testSet"),
        icon: Trophy,
        iconColor: "text-amber-600",
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
        label: "Tuyển dụng",
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
            label: "Mẫu quy trình",
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
        ],
      },
      {
        type: "testing",
        icon: BrainCircuit,
        label: "Khảo thí & Đào tạo",
        color: "text-purple-600",
        children: [
          {
            type: "questionCategories",
            icon: FolderOpen,
            label: t("common.lesson"),
            color: "text-purple-600",
          },
          {
            type: "questionBanks",
            icon: Database,
            label: t("common.questionBank"),
            color: "text-indigo-500",
          },
          {
            type: "questionMajors",
            icon: GraduationCap,
            label: t("common.specialized"),
            color: "text-pink-600",
          },
          {
            type: "practiceSets",
            icon: BookOpen,
            label: t("adminAdmindashboard.reviewSet"),
            color: "text-teal-600",
          },
          {
            type: "practiceQuestions",
            icon: FileQuestion,
            label: t("adminAdmindashboard.reviewQuestions"),
            color: "text-emerald-600",
          },
          {
            type: "quizSets",
            icon: Trophy,
            label: t("adminAdmindashboard.testSet"),
            color: "text-amber-600",
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
  const { activeTab, openTabs, setActiveTab, closeTab, resetTabsTo, closeOtherTabs } = useTabsState(
    {
      storageKey: "admin",
      defaultTab: "dashboard",
      availableTabs: availableTabs,
    }
  );
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
  const typedActiveTab: TabType = isValidTabType(activeTab) ? activeTab : "dashboard";
  useEffect(() => {
    if (!companyId) {
      return;
    }
    if (activeTab !== "companies") {
      setActiveTab("companies");
    }
  }, [activeTab, companyId, setActiveTab]);
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
  const navigateToTab = useCallback(
    (tabType: string) => {
      if (companyId && tabType !== "companies") {
        navigate(`/admin?tab=${tabType}`, {
          replace: true,
        });
        setActiveTab(tabType, true);
      } else {
        setActiveTab(tabType);
      }
    },
    [companyId, navigate, setActiveTab]
  );
  const handleTabSelect = useCallback(
    (tabId: string) => {
      const selectedTab = openTabs.find((tab) => tab.id === tabId);
      if (selectedTab) {
        navigateToTab(selectedTab.type);
      }
    },
    [navigateToTab, openTabs]
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
      case "questionCategories":
        return <QuestionCategoryManagementPage />;
      case "questionBanks":
        return <QuestionBankManagementPage />;
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
      case "companies":
        return <CompanyManagementPage isActive={isTabActive} />;
      case "candidateProfiles":
        return <CandidateProfileManagementPage />;
      case "interviewTemplates":
        return <InterviewTemplateManagementPage />;
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
          wrapper: "h-full border-r border-gray-200 bg-white",
          expandedWidth: "w-56",
          collapsedWidth: "w-16",
          logoBorder: "border-b border-gray-200",
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
          footerBorder: "border-t border-gray-200",
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
                {renderTabContent(tab.type, isTabActive)}
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
