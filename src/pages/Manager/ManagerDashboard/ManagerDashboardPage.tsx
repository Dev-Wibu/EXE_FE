import { useCallback, useState } from "react";

import { MentorManagementPage } from "../MentorManagement";
import { SessionManagementPage } from "../SessionManagement";
import { UserManagementPage } from "../UserManagement";
import type { Tab, TabType } from "./components";
import { ChromeTabs, Sidebar } from "./components";

// Generate unique tab ID
const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Get tab title based on type
const getTabTitle = (type: TabType): string => {
  switch (type) {
    case "users":
      return "User Management";
    case "mentors":
      return "Mentor Management";
    case "sessions":
      return "Session Management";
    default:
      return "New Tab";
  }
};

export function ManagerDashboardPage() {
  // Initialize with a default tab
  const [tabs, setTabs] = useState<Tab[]>([
    { id: generateTabId(), type: "users", title: "User Management" },
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
      case "users":
        return <UserManagementPage />;
      case "mentors":
        return <MentorManagementPage />;
      case "sessions":
        return <SessionManagementPage />;
      default:
        return <div>Unknown tab type</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
