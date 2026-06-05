import type { ChromeTabMenuGroup, SidebarMenuGroup } from "@/components/shared";
import {
  DashboardChromeTabs,
  DashboardSidebar,
  DashboardSidebarToggle,
  getInitialSidebarCollapsed,
  SettingsModal,
} from "@/components/shared";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { useDashboardScrollRestoration } from "@/hooks/useDashboardScrollRestoration";
import { useSettingsStore } from "@/stores/settingsStore";
import { LayoutDashboard, MessageSquare, Newspaper, Star, UserCheck, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackModerationPage } from "../FeedbackModeration";
import { MentorApplicationsPage } from "../MentorApplications";
import { PostModerationPage } from "../PostModeration";
import { ReviewModerationPage } from "../ReviewModeration";
import { SessionProcessingPage } from "../SessionProcessing";
type TabType =
  | "mentorApplications"
  | "sessions"
  | "reviewModeration"
  | "feedbackModeration"
  | "postModeration";
interface Tab {
  id: string;
  type: TabType;
  title: string;
}
const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
const STAFF_SIDEBAR_LOGO_COLLAPSED = (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600">
    <LayoutDashboard className="h-6 w-6 text-white" />
  </div>
);
export function StaffDashboardPage() {
  const { t } = useTranslation();
  const getTabTitle = (type: TabType): string => {
    switch (type) {
      case "mentorApplications":
        return t("staffStaffdashboard.browseMentors");
      case "sessions":
        return t("common.interviewSession");
      case "reviewModeration":
        return t("staffStaffdashboard.moderateYourMentorSReviews");
      case "feedbackModeration":
        return t("staffStaffdashboard.moderateResponsesFromCandidates");
      case "postModeration":
        return t("staffStaffdashboard.postModeration");
      default:
        return t("staffStaffdashboard.newTab");
    }
  };
  const CHROME_TABS_MENU_GROUPS: ChromeTabMenuGroup[] = useMemo(
    () => [
      {
        items: [
          {
            type: "mentorApplications",
            label: t("staffStaffdashboard.browseMentors"),
          },
          {
            type: "sessions",
            label: t("common.interviewSession"),
          },
        ],
      },
      {
        items: [
          {
            type: "reviewModeration",
            label: t("staffStaffdashboard.moderateYourMentorSReviews"),
            icon: Star,
            iconColor: "text-yellow-600",
          },
          {
            type: "feedbackModeration",
            label: t("staffStaffdashboard.moderateCandidateResponses"),
            icon: MessageSquare,
            iconColor: "text-cyan-600",
          },
          {
            type: "postModeration",
            label: t("staffStaffdashboard.postModeration"),
            icon: Newspaper,
            iconColor: "text-purple-600",
          },
        ],
      },
    ],
    [t]
  );
  const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = useMemo(
    () => [
      {
        label: t("common.profession"),
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
        ],
      },
      {
        label: t("staffStaffdashboard.censor"),
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
    ],
    [t]
  );
  const STAFF_SIDEBAR_LOGO = useMemo(
    () => (
      <>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {t("staffStaffdashboard.coordinationPanel")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t("staffStaffdashboard.permanentProcessing")}
          </p>
        </div>
      </>
    ),
    [t]
  );
  const sidebarBehavior = useSettingsStore((state) => state.sidebarBehavior);
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
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: generateTabId(),
      type: "mentorApplications",
      title: t("staffStaffdashboard.browseMentors"),
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  useDashboardScrollRestoration(contentRef, {
    scopeKey: activeTabId,
  });
  useEffect(() => {
    setIsSidebarCollapsed(sidebarBehavior === "auto-collapse");
  }, [sidebarBehavior]);
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);
  const handleTabClose = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        const newTabs = prevTabs.filter((tab) => tab.id !== tabId);
        if (tabId === activeTabId && newTabs.length > 0) {
          const closedIndex = prevTabs.findIndex((tab) => tab.id === tabId);
          const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
          setActiveTabId(newTabs[newActiveIndex].id);
        }
        return newTabs;
      });
    },
    [activeTabId]
  );
  const handleNewTab = useCallback(
    (type: string) => {
      const newTab: Tab = {
        id: generateTabId(),
        type: type as TabType,
        title: getTabTitle(type as TabType),
      };
      setTabs((prevTabs) => [...prevTabs, newTab]);
      setActiveTabId(newTab.id);
    },
    [t]
  );
  const handleSidebarNavigate = useCallback(
    (type: string) => {
      const existingTab = tabs.find((tab) => tab.type === type);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        handleNewTab(type);
      }
    },
    [tabs, handleNewTab]
  );
  const renderContent = () => {
    if (!activeTab) return null;
    switch (activeTab.type) {
      case "mentorApplications":
        return <MentorApplicationsPage />;
      case "sessions":
        return <SessionProcessingPage />;
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
    setScrollTarget(node);
  }, []);
  return (
    <div className="isolate flex h-screen bg-gray-50 dark:bg-slate-950">
      <DashboardSidebar
        menuGroups={SIDEBAR_MENU_GROUPS}
        activeTab={activeTab?.type || "mentorApplications"}
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
          wrapper: "h-full border-r border-gray-200 bg-white",
          expandedWidth: "w-56",
          collapsedWidth: "w-16",
          logoBorder: "border-b border-gray-200",
          logoExpandedPadding: "h-14 gap-3 px-4",
          logoCollapsedPadding: "h-14 justify-center px-2",
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

      <div className="relative z-0 flex flex-1 flex-col overflow-hidden">
        <DashboardChromeTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
          leftSlot={
            <DashboardSidebarToggle
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden h-7 w-7 rounded-full border border-slate-300/85 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 md:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            />
          }
          menuGroups={CHROME_TABS_MENU_GROUPS}
          compact
          theme={{
            bg: "bg-gray-100",
            tabActiveBorder: "border-gray-200",
            tabActiveBg: "bg-white",
            tabActiveText: "text-gray-900",
            tabInactiveBg: "bg-gray-200",
            tabInactiveHover: "hover:bg-gray-100",
            tabInactiveText: "text-gray-600",
            closeHover: "hover:bg-gray-200",
            addBtnBg: "bg-transparent",
            addBtnHover: "hover:bg-gray-200",
            menuHover: "hover:bg-accent",
          }}
        />

        <div ref={handleContentRef} className="flex-1 overflow-auto">
          {renderContent()}
        </div>
        <ScrollToTopButton target={scrollTarget} threshold={600} />
      </div>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
