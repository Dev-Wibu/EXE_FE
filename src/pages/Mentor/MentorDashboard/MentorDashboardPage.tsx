import { useCallback, useMemo } from "react";

import { useTabsState } from "@/hooks/useTabsState";

import { PostListPage } from "../../User/Community";
import { MentorAccountPage } from "../Account";
import { GivenFeedbackListPage } from "../Feedback";
import { MentorNotificationsPage } from "../Notifications";
import { MentorOverviewPage } from "../Overview";
import { MentorReviewsPage } from "../Reviews";
import { MentorSessionsPage } from "../Sessions";
import { StudentsListPage } from "../Students";
import type { Tab, TabType } from "./components";
import { ChromeTabs, Sidebar } from "./components";

/**
 * Available tabs configuration for the mentor dashboard
 */
const AVAILABLE_TABS: Array<{ type: TabType; label: string }> = [
  { type: "overview", label: "Tổng quan" },
  { type: "sessions", label: "Phiên phỏng vấn" },
  { type: "students", label: "Học viên" },
  { type: "reviews", label: "Đánh giá" },
  { type: "feedback", label: "Phản hồi đã gửi" },
  { type: "community", label: "Cộng đồng" },
  { type: "notifications", label: "Thông báo" },
  { type: "account", label: "Tài khoản" },
];

/**
 * Type guard to check if a string is a valid TabType
 */
const isValidTabType = (value: string): value is TabType => {
  return AVAILABLE_TABS.some((tab) => tab.type === value);
};

const DEFAULT_TAB: TabType = "overview";

export function MentorDashboardPage() {
  // Use the tabs state hook with URL + localStorage persistence
  const { activeTab, openTabs, setActiveTab, openTab, closeTab } = useTabsState({
    storageKey: "mentor",
    defaultTab: DEFAULT_TAB,
    availableTabs: AVAILABLE_TABS,
  });

  // Validate and get the typed active tab
  const typedActiveTab: TabType = isValidTabType(activeTab) ? activeTab : DEFAULT_TAB;

  // Convert openTabs to the format expected by ChromeTabs component
  const chromeTabsData: Tab[] = useMemo(() => {
    return openTabs
      .filter((tab) => isValidTabType(tab.type))
      .map((tab) => ({
        id: tab.id,
        type: tab.type as TabType,
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
      case "community":
        return <PostListPage />;
      case "notifications":
        return <MentorNotificationsPage />;
      case "account":
        return <MentorAccountPage />;
      default:
        return <div>Loại tab không hợp lệ</div>;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
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
        <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
