import i18n from "@/lib/i18n";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabsState } from "./useTabsState";
const t = i18n.t.bind(i18n);
const AVAILABLE_TABS = [
  {
    type: "dashboard",
    label: "Dashboard",
  },
  {
    type: "users",
    label: t("common.userManagement"),
  },
  {
    type: "mentors",
    label: t("common.mentorManagement"),
  },
];
const createWrapper = (initialEntry = "/admin?tab=dashboard") => {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  );
};
describe("useTabsState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it(t("general.resettabstoRetainsExactlyOneTarget"), async () => {
    const { result } = renderHook(
      () =>
        useTabsState({
          storageKey: "admin_reset_tabs_test",
          defaultTab: "dashboard",
          availableTabs: AVAILABLE_TABS,
        }),
      {
        wrapper: createWrapper("/admin?tab=users"),
      }
    );
    await waitFor(() => {
      expect(result.current.activeTab).toBe("users");
    });
    act(() => {
      result.current.openTab("mentors");
    });
    await waitFor(() => {
      expect(result.current.openTabs.length).toBeGreaterThan(1);
    });
    act(() => {
      result.current.resetTabsTo("dashboard");
    });
    await waitFor(() => {
      expect(result.current.activeTab).toBe("dashboard");
      expect(result.current.openTabs).toHaveLength(1);
      expect(result.current.openTabs[0]?.type).toBe("dashboard");
    });
  });
  it(t("general.ignoreResettabstoWhenTabIs"), async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(
      () =>
        useTabsState({
          storageKey: "admin_reset_invalid_tab_test",
          defaultTab: "dashboard",
          availableTabs: AVAILABLE_TABS,
        }),
      {
        wrapper: createWrapper("/admin?tab=dashboard"),
      }
    );
    const tabTypesBefore = result.current.openTabs.map((tab) => tab.type);
    act(() => {
      result.current.resetTabsTo("invalid-tab");
    });
    await waitFor(() => {
      expect(result.current.openTabs.map((tab) => tab.type)).toEqual(tabTypesBefore);
      expect(result.current.activeTab).toBe("dashboard");
    });
    warnSpy.mockRestore();
  });

  describe("activeTab fallback", () => {
    it("falls back to defaultTab when URL has no tab param", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_fallback_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin"),
        }
      );

      await waitFor(() => {
        expect(result.current.activeTab).toBe("dashboard");
      });
    });

    it("falls back to defaultTab when URL has invalid tab type", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_invalid_url_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=nonexistent"),
        }
      );

      await waitFor(() => {
        expect(result.current.activeTab).toBe("dashboard");
      });
    });
  });

  describe("setActiveTab", () => {
    it("switches to a valid tab and updates URL", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_set_active_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        expect(result.current.activeTab).toBe("dashboard");
      });

      act(() => {
        result.current.setActiveTab("users");
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe("users");
      });
    });

    it("creates the tab in openTabs if it doesn't exist yet", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_set_active_create_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(1);
      });

      act(() => {
        result.current.setActiveTab("mentors");
      });

      await waitFor(() => {
        const types = result.current.openTabs.map((t) => t.type);
        expect(types).toContain("mentors");
        expect(types).toContain("dashboard");
      });
    });

    it("warns and does nothing for invalid tab type", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_set_active_invalid_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        expect(result.current.activeTab).toBe("dashboard");
      });

      act(() => {
        result.current.setActiveTab("nonexistent");
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe("dashboard");
      });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid tab type"));
      warnSpy.mockRestore();
    });
  });

  describe("openTab", () => {
    it("opens a new tab and sets it active", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_open_tab_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(1);
      });

      act(() => {
        result.current.openTab("users");
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe("users");
        const types = result.current.openTabs.map((t) => t.type);
        expect(types).toContain("users");
      });
    });

    it("switches to already-open tab without creating duplicate", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_open_existing_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      // Open users tab
      act(() => {
        result.current.openTab("users");
      });

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(2);
      });

      // Switch back to dashboard
      act(() => {
        result.current.openTab("dashboard");
      });

      await waitFor(() => {
        expect(result.current.activeTab).toBe("dashboard");
        // Should still be 2 tabs, not 3
        expect(result.current.openTabs).toHaveLength(2);
      });
    });

    it("warns for invalid tab type and does nothing", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_open_invalid_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      const countBefore = result.current.openTabs.length;

      act(() => {
        result.current.openTab("nonexistent");
      });

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(countBefore);
      });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("closeTab", () => {
    it("removes the specified tab", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_close_tab_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      // Open users tab
      act(() => {
        result.current.openTab("users");
      });

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(2);
      });

      // Close users tab by its ID
      const usersTab = result.current.openTabs.find((t) => t.type === "users");
      expect(usersTab).toBeDefined();

      act(() => {
        result.current.closeTab(usersTab!.id);
      });

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(1);
        expect(result.current.openTabs[0]?.type).toBe("dashboard");
      });
    });

    it("does not allow closing the last remaining tab", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_close_last_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(1);
      });

      const onlyTab = result.current.openTabs[0]!;

      act(() => {
        result.current.closeTab(onlyTab.id);
      });

      // Should still have 1 tab
      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(1);
        expect(result.current.openTabs[0]?.type).toBe("dashboard");
      });
    });

    it("switches active tab when closing the active tab", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_close_active_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      // Open users and mentors tabs
      act(() => {
        result.current.openTab("users");
      });
      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(2);
      });

      act(() => {
        result.current.openTab("mentors");
      });
      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(3);
        expect(result.current.activeTab).toBe("mentors");
      });

      // Close the active tab (mentors)
      const mentorsTab = result.current.openTabs.find((t) => t.type === "mentors");
      act(() => {
        result.current.closeTab(mentorsTab!.id);
      });

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(2);
        // Active tab should switch to a neighboring tab
        expect(["dashboard", "users"]).toContain(result.current.activeTab);
      });
    });

    it("picks the tab at closedIndex when available, otherwise last tab", async () => {
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey: "admin_close_index_test",
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      // Open users (index 1) then mentors (index 2)
      act(() => {
        result.current.openTab("users");
      });
      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(2);
      });

      act(() => {
        result.current.openTab("mentors");
      });
      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(3);
      });

      // Switch to users (index 1) and close it
      act(() => {
        result.current.setActiveTab("users");
      });
      await waitFor(() => {
        expect(result.current.activeTab).toBe("users");
      });

      const usersTab = result.current.openTabs.find((t) => t.type === "users");
      act(() => {
        result.current.closeTab(usersTab!.id);
      });

      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(2);
        // closedIndex=1, newTabs.length=2, so newActiveIndex=min(1,1)=1 → mentors
        expect(result.current.activeTab).toBe("mentors");
      });
    });
  });

  describe("localStorage persistence", () => {
    it("saves openTabs to localStorage", async () => {
      const storageKey = "admin_storage_test";
      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey,
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      act(() => {
        result.current.openTab("users");
      });

      await waitFor(() => {
        const saved = localStorage.getItem(`tabs_state_${storageKey}`);
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed.tabs).toHaveLength(2);
        expect(parsed.version).toBe(1);
      });
    });

    it("restores tabs from localStorage on mount", async () => {
      const storageKey = "admin_restore_test";
      // Pre-populate localStorage
      localStorage.setItem(
        `tabs_state_${storageKey}`,
        JSON.stringify({
          tabs: [
            { id: "dashboard-1", type: "dashboard", label: "Dashboard" },
            { id: "users-1", type: "users", label: "Users" },
          ],
          lastActiveTab: "users",
          version: 1,
        })
      );

      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey,
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        const types = result.current.openTabs.map((t) => t.type);
        expect(types).toContain("dashboard");
        expect(types).toContain("users");
      });
    });

    it("filters out invalid tab types from localStorage", async () => {
      const storageKey = "admin_filter_invalid_test";
      localStorage.setItem(
        `tabs_state_${storageKey}`,
        JSON.stringify({
          tabs: [
            { id: "dashboard-1", type: "dashboard", label: "Dashboard" },
            { id: "deleted-1", type: "deleted_feature", label: "Deleted" },
          ],
          lastActiveTab: "dashboard",
          version: 1,
        })
      );

      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey,
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      await waitFor(() => {
        const types = result.current.openTabs.map((t) => t.type);
        expect(types).toContain("dashboard");
        expect(types).not.toContain("deleted_feature");
      });
    });

    it("handles corrupt localStorage gracefully", async () => {
      const storageKey = "admin_corrupt_test";
      localStorage.setItem(`tabs_state_${storageKey}`, "not-valid-json{");

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(
        () =>
          useTabsState({
            storageKey,
            defaultTab: "dashboard",
            availableTabs: AVAILABLE_TABS,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
        }
      );

      // Should fall back to default tab
      await waitFor(() => {
        expect(result.current.openTabs).toHaveLength(1);
        expect(result.current.openTabs[0]?.type).toBe("dashboard");
      });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("translatedOpenTabs", () => {
    it("updates labels when availableTabs labels change", async () => {
      const { result, rerender } = renderHook(
        ({ tabs }) =>
          useTabsState({
            storageKey: "admin_translate_test",
            defaultTab: "dashboard",
            availableTabs: tabs,
          }),
        {
          wrapper: createWrapper("/admin?tab=dashboard"),
          initialProps: { tabs: AVAILABLE_TABS },
        }
      );

      await waitFor(() => {
        expect(result.current.openTabs[0]?.label).toBe("Dashboard");
      });

      // Change the label for dashboard
      const updatedTabs = [
        { type: "dashboard", label: "New Dashboard Label" },
        ...AVAILABLE_TABS.slice(1),
      ];

      rerender({ tabs: updatedTabs });

      await waitFor(() => {
        expect(result.current.openTabs[0]?.label).toBe("New Dashboard Label");
      });
    });
  });
});
