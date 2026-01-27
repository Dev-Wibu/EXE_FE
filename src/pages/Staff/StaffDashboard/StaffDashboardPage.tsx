import { useCallback, useState } from "react";

import { ContentModerationPage } from "../ContentModeration";
import { FeedbackModerationPage } from "../FeedbackModeration";
import { MentorApplicationsPage } from "../MentorApplications";
import { ReviewModerationPage } from "../ReviewModeration";
import { SessionProcessingPage } from "../SessionProcessing";
import { UserSupportPage } from "../UserSupport";
import type { Tab, TabType } from "./components";
import { ChromeTabs, Sidebar } from "./components";

// Generate unique tab ID
const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Get tab title based on type
const getTabTitle = (type: TabType): string => {
  switch (type) {
    case "mentorApplications":
      return "Duyệt Mentor";
    case "sessions":
      return "Phiên Phỏng Vấn";
    case "userSupport":
      return "Hỗ Trợ";
    case "contentModeration":
      return "Kiểm Duyệt";
    case "reviewModeration":
      return "Kiểm Duyệt Đánh Giá";
    case "feedbackModeration":
      return "Kiểm Duyệt Phản Hồi";
    default:
      return "Tab Mới";
  }
};

/**
 * Staff Dashboard Page
 *
 * This page is designed for STAFF role users who handle operational tasks.
 * Key differences from Admin Dashboard:
 *
 * - Staff focuses on PROCESSING tasks (approvals, support, moderation)
 * - Admin focuses on MANAGEMENT tasks (configuration, user roles, settings)
 *
 * Staff features:
 * - Mentor application verification/approval
 * - Session monitoring and issue handling
 * - User support ticket management
 * - Content moderation (questions, resources)
 * - Review moderation
 * - Feedback moderation
 *
 * Admin features (not included here):
 * - User role management
 * - System configuration
 * - Question set configuration
 * - User CRUD operations
 */
export function StaffDashboardPage() {
  // Initialize with mentor applications as the default tab (most common task)
  const [tabs, setTabs] = useState<Tab[]>([
    { id: generateTabId(), type: "mentorApplications", title: "Duyệt Mentor" },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  // Get the active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Handle tab selection
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // Handle tab close
  const handleTabClose = useCallback(
    (tabId: string) => {
      setTabs((prevTabs) => {
        const newTabs = prevTabs.filter((tab) => tab.id !== tabId);
        // If we're closing the active tab, switch to another tab
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

  // Handle new tab creation
  const handleNewTab = useCallback((type: TabType) => {
    const newTab: Tab = {
      id: generateTabId(),
      type,
      title: getTabTitle(type),
    };
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Handle sidebar navigation (opens in new tab or switches to existing)
  const handleSidebarNavigate = useCallback(
    (type: TabType) => {
      // Check if a tab of this type already exists
      const existingTab = tabs.find((tab) => tab.type === type);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        handleNewTab(type);
      }
    },
    [tabs, handleNewTab]
  );

  // Render the content based on active tab type
  const renderContent = () => {
    if (!activeTab) return null;

    switch (activeTab.type) {
      case "mentorApplications":
        return <MentorApplicationsPage />;
      case "sessions":
        return <SessionProcessingPage />;
      case "userSupport":
        return <UserSupportPage />;
      case "contentModeration":
        return <ContentModerationPage />;
      case "reviewModeration":
        return <ReviewModerationPage />;
      case "feedbackModeration":
        return <FeedbackModerationPage />;
      default:
        return <div>Unknown tab type</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar onNavigate={handleSidebarNavigate} currentView={activeTab?.type} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chrome Tabs */}
        <ChromeTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
