/**
 * Custom hook for managing tab state with URL synchronization and localStorage persistence.
 *
 * Features:
 * - Active tab stored in URL query parameter (?tab=xxx)
 * - Open tabs persisted in localStorage
 * - Automatic validation and fallback for invalid tab types
 * - Browser history support (back/forward navigation)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY_PREFIX = "tabs_state_";

interface Tab {
  id: string;
  type: string;
  label: string;
}

interface TabsStateStorage {
  tabs: Tab[];
  lastActiveTab: string;
  version: number;
}

interface UseTabsStateOptions {
  /** Storage key suffix, e.g., "admin" → "tabs_state_admin" */
  storageKey: string;
  /** Default tab type to show when no tab is specified */
  defaultTab: string;
  /** List of available tabs with type and label */
  availableTabs: Array<{ type: string; label: string }>;
}

interface UseTabsStateReturn {
  /** Currently active tab type from URL */
  activeTab: string;
  /** List of open tabs */
  openTabs: Tab[];
  /** Change active tab (updates URL) */
  setActiveTab: (_tabType: string) => void;
  /** Open a new tab or switch to existing */
  openTab: (_tabType: string) => void;
  /** Close a tab by ID */
  closeTab: (_tabId: string) => void;
}

/**
 * Generate unique tab ID
 */
const generateTabId = (type: string): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Validate if a tab type exists in available tabs
 */
const isValidTabType = (
  tabType: string | null,
  availableTabs: Array<{ type: string; label: string }>
): tabType is string => {
  return tabType !== null && availableTabs.some((t) => t.type === tabType);
};

/**
 * Hook for managing tab state with URL and localStorage synchronization
 */
export function useTabsState(options: UseTabsStateOptions): UseTabsStateReturn {
  const { storageKey, defaultTab, availableTabs } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const fullStorageKey = `${STORAGE_KEY_PREFIX}${storageKey}`;

  // Ref to track pending active tab change (for closeTab synchronization)
  const pendingActiveTabRef = useRef<string | null>(null);

  // Read active tab from URL, validate and fallback to default if invalid
  const urlTabParam = searchParams.get("tab");
  const activeTab = isValidTabType(urlTabParam, availableTabs) ? urlTabParam : defaultTab;

  // Helper function to create initial tabs including active tab from URL
  const createInitialTabs = useCallback((): Tab[] => {
    let initialTabs: Tab[] = [];

    try {
      const saved = localStorage.getItem(fullStorageKey);
      if (saved) {
        const parsed: TabsStateStorage = JSON.parse(saved);
        // Validate saved tabs against available tabs
        const validTabs = parsed.tabs?.filter((tab) =>
          availableTabs.some((available) => available.type === tab.type)
        );
        if (validTabs && validTabs.length > 0) {
          initialTabs = validTabs;
        }
      }
    } catch (e) {
      console.warn("Failed to load tabs state from localStorage:", e);
    }

    // Default: create a tab for the default tab type if no valid tabs found
    if (initialTabs.length === 0) {
      const defaultTabConfig = availableTabs.find((t) => t.type === defaultTab);
      if (defaultTabConfig) {
        initialTabs = [
          {
            id: generateTabId(defaultTab),
            type: defaultTab,
            label: defaultTabConfig.label,
          },
        ];
      }
    }

    // Ensure the active tab (from URL) exists in the initial tabs
    const activeTabFromUrl = searchParams.get("tab");
    const effectiveActiveTab = isValidTabType(activeTabFromUrl, availableTabs)
      ? activeTabFromUrl
      : defaultTab;

    const activeTabExists = initialTabs.some((tab) => tab.type === effectiveActiveTab);
    if (!activeTabExists) {
      const tabConfig = availableTabs.find((t) => t.type === effectiveActiveTab);
      if (tabConfig) {
        initialTabs = [
          ...initialTabs,
          {
            id: generateTabId(effectiveActiveTab),
            type: effectiveActiveTab,
            label: tabConfig.label,
          },
        ];
      }
    }

    return initialTabs;
  }, [availableTabs, defaultTab, fullStorageKey, searchParams]);

  // State for open tabs - initialized from localStorage with active tab check
  const [openTabs, setOpenTabs] = useState<Tab[]>(createInitialTabs);

  // Handle pending active tab change from closeTab
  useEffect(() => {
    if (pendingActiveTabRef.current) {
      const newActiveTab = pendingActiveTabRef.current;
      pendingActiveTabRef.current = null;
      setSearchParams({ tab: newActiveTab }, { replace: true });
    }
  }, [openTabs, setSearchParams]);

  // Sync openTabs to localStorage
  useEffect(() => {
    try {
      const stateToSave: TabsStateStorage = {
        tabs: openTabs,
        lastActiveTab: activeTab,
        version: 1,
      };
      localStorage.setItem(fullStorageKey, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to save tabs state to localStorage:", e);
    }
  }, [openTabs, activeTab, fullStorageKey]);

  // Set active tab (updates URL) and ensure tab exists in openTabs
  const setActiveTab = useCallback(
    (tabType: string) => {
      // Validate tab type
      if (!isValidTabType(tabType, availableTabs)) {
        console.warn(`Invalid tab type: ${tabType}`);
        return;
      }

      // Ensure the tab exists in openTabs before changing URL
      setOpenTabs((prev) => {
        const tabExists = prev.some((tab) => tab.type === tabType);
        if (!tabExists) {
          const tabConfig = availableTabs.find((t) => t.type === tabType);
          if (tabConfig) {
            return [
              ...prev,
              {
                id: generateTabId(tabType),
                type: tabType,
                label: tabConfig.label,
              },
            ];
          }
        }
        return prev;
      });

      setSearchParams({ tab: tabType }, { replace: true });
    },
    [setSearchParams, availableTabs]
  );

  // Open a new tab or switch to existing
  const openTab = useCallback(
    (tabType: string) => {
      const tabConfig = availableTabs.find((t) => t.type === tabType);
      if (!tabConfig) {
        console.warn(`Invalid tab type: ${tabType}`);
        return;
      }

      // Check if tab already exists
      const existingTab = openTabs.find((t) => t.type === tabType);
      if (existingTab) {
        // Switch to existing tab
        setActiveTab(tabType);
        return;
      }

      // Add new tab
      const newTab: Tab = {
        id: generateTabId(tabType),
        type: tabType,
        label: tabConfig.label,
      };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTab(tabType);
    },
    [availableTabs, openTabs, setActiveTab]
  );

  // Close a tab by ID
  const closeTab = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => {
        const tabToClose = prev.find((t) => t.id === tabId);
        const newTabs = prev.filter((t) => t.id !== tabId);

        // Don't allow closing the last tab
        if (newTabs.length === 0) {
          return prev;
        }

        // If closing the active tab, mark pending active tab change
        if (tabToClose?.type === activeTab) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
          pendingActiveTabRef.current = newTabs[newActiveIndex].type;
        }

        return newTabs;
      });
    },
    [activeTab]
  );

  return {
    activeTab,
    openTabs,
    setActiveTab,
    openTab,
    closeTab,
  };
}
