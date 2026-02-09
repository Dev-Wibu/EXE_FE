import { useCallback, useMemo } from "react";

import { useTabsState } from "@/hooks/useTabsState";

import { DashboardOverviewPage } from "../DashboardOverview";
import { FeedbackManagementPage } from "../FeedbackManagement";
import { MentorManagementPage } from "../MentorManagement";
import { NotificationManagementPage } from "../NotificationManagement";
import { QuestionCategoryManagementPage } from "../QuestionCategoryManagement";
import { QuestionMajorManagementPage } from "../QuestionMajorManagement";
import { QuestionSetManagementPage } from "../QuestionSetManagement";
import { PracticeQuestionManagementPage } from "../PracticeQuestionManagement";
import { QuizSetManagementPage } from "../QuizSetManagement";
import { ReviewManagementPage } from "../ReviewManagement";
import { SessionManagementPage } from "../SessionManagement";
import { UserManagementPage } from "../UserManagement";
import { CandidateProfileManagementPage } from "../CandidateProfileManagement";
import { PostManagementPage } from "../PostManagement";
import type { Tab, TabType } from "./components";
import { ChromeTabs, Sidebar } from "./components";

/**
 * Available tabs configuration for the admin dashboard
 * Defines all possible tab types with their display labels
 */
const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "dashboard", label: "Dashboard" },
  { type: "users", label: "User Management" },
  { type: "mentors", label: "Mentor Management" },
  { type: "sessions", label: "Session Management" },
  { type: "reviews", label: "Review Management" },
  { type: "feedback", label: "Feedback Management" },
  { type: "notifications", label: "Notification Management" },
  { type: "questionCategories", label: "Question Categories" },
  { type: "questionMajors", label: "Question Majors" },
  { type: "questionSets", label: "Question Sets" },
  { type: "practiceQuestions", label: "Practice Questions" },
  { type: "quizSets", label: "Quiz Sets" },
  { type: "posts", label: "Quản lý bài viết" },
  { type: "candidateProfiles", label: "Hồ sơ ứng viên" },
];

/**
 * Type guard to check if a string is a valid TabType
 */
const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

export function AdminDashboardPage() {
  // Use the tabs state hook with URL + localStorage persistence
  const { activeTab, openTabs, setActiveTab, openTab, closeTab } = useTabsState({
    storageKey: "admin",
    defaultTab: "dashboard",
    availableTabs: AVAILABLE_TABS,
  });

  // Validate and get the typed active tab
  const typedActiveTab: TabType = isValidTabType(activeTab) ? activeTab : "dashboard";

  // Convert openTabs to the format expected by ChromeTabs component
  const chromeTabsData: Tab[] = useMemo(() => {
    return openTabs
      .filter((tab) => isValidTabType(tab.type))
      .map((tab) => ({
        id: tab.id,
        type: tab.type as TabType, // Safe cast after filter
        title: tab.label,
      }));
  }, [openTabs]);

  // Find active tab ID for ChromeTabs component
  const activeTabId = useMemo(() => {
    const activeTabData = openTabs.find((tab) => tab.type === activeTab);
    return activeTabData?.id || "";
  }, [openTabs, activeTab]);

  // Handle tab selection in ChromeTabs - convert tab ID to type
  const handleTabSelect = useCallback(
    (tabId: string) => {
      const selectedTab = openTabs.find((tab) => tab.id === tabId);
      if (selectedTab) {
        setActiveTab(selectedTab.type);
      }
    },
    [openTabs, setActiveTab]
  );

  // Handle new tab creation
  const handleNewTab = useCallback(
    (type: TabType) => {
      openTab(type);
    },
    [openTab]
  );

  // Render the content based on active tab type
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
      case "questionSets":
        return <QuestionSetManagementPage />;
      case "practiceQuestions":
        return <PracticeQuestionManagementPage />;
      case "quizSets":
        return <QuizSetManagementPage />;
      case "posts":
        return <PostManagementPage />;
      case "candidateProfiles":
        return <CandidateProfileManagementPage />;
      default:
        return <div>Unknown tab type</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar onNavigate={openTab} currentView={typedActiveTab} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chrome Tabs */}
        <ChromeTabs
          tabs={chromeTabsData}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={closeTab}
          onNewTab={handleNewTab}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
