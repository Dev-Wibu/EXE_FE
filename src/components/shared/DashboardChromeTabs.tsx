import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface ChromeTabMenuItem {
  type: string;
  label: string;
  icon?: React.ElementType;
  iconColor?: string;
}

export interface ChromeTabMenuGroup {
  items: ChromeTabMenuItem[];
}

export interface ChromeTabMenuAction {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: React.ElementType;
  iconColor?: string;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ChromeTabsTheme {
  bg: string;
  tabActiveBorder: string;
  tabActiveBg: string;
  tabActiveText?: string;
  tabInactiveBg: string;
  tabInactiveHover: string;
  tabInactiveText?: string;
  closeHover: string;
  addBtnBg: string;
  addBtnHover: string;
  menuHover: string;
  menuWidth?: string;
}

export interface DashboardChromeTabsProps {
  tabs: Array<{ id: string; type: string; title: string }>;
  activeTabId: string;
  onTabSelect: (_tabId: string) => void;
  onTabClose: (_tabId: string) => void;
  onNewTab: (_type: string) => void;
  rightSlot?: React.ReactNode;
  tabIcons?: Record<string, React.ElementType>;
  tabColors?: Record<string, string>;
  menuGroups: ChromeTabMenuGroup[];
  menuActions?: ChromeTabMenuAction[];
  compact?: boolean;
  theme: ChromeTabsTheme;
}

export function DashboardChromeTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  rightSlot,
  tabIcons,
  tabColors,
  menuGroups,
  menuActions,
  compact = false,
  theme,
}: DashboardChromeTabsProps) {
  const [showNewTabMenu, setShowNewTabMenu] = useState(false);
  const [newTabMenuPosition, setNewTabMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const newTabButtonRef = useRef<HTMLButtonElement>(null);
  const newTabMenuRef = useRef<HTMLDivElement>(null);
  const tabCount = Math.max(tabs.length, 1);
  const tabGapPx = 4;
  const addButtonReservedWidthPx = 40;
  const dynamicTabWidth = `clamp(128px, calc((100% - ${
    addButtonReservedWidthPx + (tabCount - 1) * tabGapPx
  }px) / ${tabCount}), 220px)`;

  const updateNewTabMenuPosition = useCallback(() => {
    if (!showNewTabMenu || !newTabButtonRef.current || !newTabMenuRef.current) {
      return;
    }

    const buttonRect = newTabButtonRef.current.getBoundingClientRect();
    const menuRect = newTabMenuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeMargin = 8;
    const menuGap = 6;

    const canOpenRight = buttonRect.left + menuRect.width <= viewportWidth - safeMargin;
    const canOpenLeft = buttonRect.right - menuRect.width >= safeMargin;

    let left = buttonRect.left;
    if (!canOpenRight && canOpenLeft) {
      left = buttonRect.right - menuRect.width;
    }
    left = Math.max(safeMargin, Math.min(left, viewportWidth - menuRect.width - safeMargin));

    let top = buttonRect.bottom + menuGap;
    if (top + menuRect.height > viewportHeight - safeMargin) {
      const aboveTop = buttonRect.top - menuRect.height - menuGap;
      if (aboveTop >= safeMargin) {
        top = aboveTop;
      } else {
        top = Math.max(safeMargin, viewportHeight - menuRect.height - safeMargin);
      }
    }

    setNewTabMenuPosition({ top, left });
  }, [showNewTabMenu]);

  const closeNewTabMenu = useCallback(() => {
    setShowNewTabMenu(false);
    setNewTabMenuPosition(null);
  }, []);

  useEffect(() => {
    if (!showNewTabMenu) {
      return;
    }

    updateNewTabMenuPosition();

    const repositionMenu = () => updateNewTabMenuPosition();
    window.addEventListener("resize", repositionMenu);
    window.addEventListener("scroll", repositionMenu, true);

    return () => {
      window.removeEventListener("resize", repositionMenu);
      window.removeEventListener("scroll", repositionMenu, true);
    };
  }, [showNewTabMenu, updateNewTabMenuPosition]);

  useEffect(() => {
    if (!showNewTabMenu) {
      return;
    }

    const closeByEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNewTabMenu();
      }
    };

    window.addEventListener("keydown", closeByEscape);
    return () => {
      window.removeEventListener("keydown", closeByEscape);
    };
  }, [closeNewTabMenu, showNewTabMenu]);

  const newTabButton = (
    <div data-testid="chrome-tabs-new-tab" className={cn("shrink-0", showNewTabMenu && "z-40")}>
      <button
        ref={newTabButtonRef}
        type="button"
        onClick={() => {
          if (showNewTabMenu) {
            closeNewTabMenu();
            return;
          }
          setShowNewTabMenu(true);
        }}
        aria-label="Mở menu tab"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl border border-transparent transition-colors dark:bg-slate-700 dark:hover:bg-slate-600",
          theme.addBtnBg,
          theme.addBtnHover
        )}>
        <Plus className="h-4 w-4 dark:text-slate-300" />
      </button>

      {showNewTabMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={closeNewTabMenu} />
          <div
            ref={newTabMenuRef}
            style={{
              top: newTabMenuPosition?.top ?? 0,
              left: newTabMenuPosition?.left ?? 0,
              visibility: newTabMenuPosition ? "visible" : "hidden",
            }}
            className={cn(
              "fixed z-40 rounded-lg border bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800",
              theme.menuWidth || "w-48"
            )}>
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                {groupIdx > 0 && <div className="my-1 border-t dark:border-slate-600" />}
                {group.items.map((item) => (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => {
                      onNewTab(item.type);
                      closeNewTabMenu();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm dark:text-slate-200 dark:hover:bg-slate-700",
                      theme.menuHover
                    )}>
                    {item.icon && <item.icon className={cn("h-4 w-4", item.iconColor)} />}
                    {item.label}
                  </button>
                ))}
              </div>
            ))}

            {menuActions && menuActions.length > 0 && (
              <>
                <div className="my-1 border-t dark:border-slate-600" />
                {menuActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      type="button"
                      key={action.id}
                      onClick={() => {
                        if (action.disabled) {
                          return;
                        }
                        action.onSelect();
                        closeNewTabMenu();
                      }}
                      disabled={action.disabled}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm dark:hover:bg-slate-700",
                        theme.menuHover,
                        action.destructive
                          ? "text-red-600 dark:text-red-400"
                          : "dark:text-slate-200",
                        action.disabled && "cursor-not-allowed opacity-50"
                      )}>
                      {ActionIcon && <ActionIcon className={cn("h-4 w-4", action.iconColor)} />}
                      {action.label}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (compact) {
    return (
      <div
        className={cn(
          "flex h-14 items-end gap-1.5 border-b px-2 pb-0 dark:border-slate-800 dark:bg-slate-900",
          theme.bg
        )}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={cn(
              "group flex h-9 cursor-pointer items-center gap-2 rounded-t-xl border-x border-t px-3.5 text-sm transition-colors duration-200",
              tab.id === activeTabId
                ? cn(
                    theme.tabActiveBorder,
                    theme.tabActiveBg,
                    theme.tabActiveText,
                    "shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  )
                : cn(
                    "border-transparent",
                    theme.tabInactiveBg,
                    theme.tabInactiveText,
                    theme.tabInactiveHover,
                    "dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  )
            )}>
            <span className="max-w-32 truncate">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:hover:bg-slate-600",
                  theme.closeHover
                )}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {newTabButton}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-14 items-end border-b dark:border-slate-800 dark:bg-slate-900",
        theme.bg
      )}>
      {/* Tab List */}
      <div
        data-testid="chrome-tabs-full-strip"
        className="flex h-full min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-visible px-2 pb-0">
        {tabs.map((tab) => {
          const Icon = tabIcons?.[tab.type];
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              style={{ width: dynamicTabWidth }}
              onClick={() => onTabSelect(tab.id)}
              className={cn(
                "group flex min-w-32 shrink-0 cursor-pointer items-center gap-2 rounded-t-xl border-x border-t px-3.5 py-2 shadow-sm transition-all duration-200",
                isActive
                  ? cn(
                      theme.tabActiveBorder,
                      theme.tabActiveBg,
                      theme.tabActiveText,
                      "dark:border-slate-700 dark:bg-slate-800"
                    )
                  : cn(
                      "border-transparent",
                      theme.tabInactiveBg,
                      theme.tabInactiveHover,
                      "dark:bg-slate-800/50 dark:hover:bg-slate-800"
                    )
              )}>
              {Icon && <Icon className={cn("h-4 w-4 shrink-0", tabColors?.[tab.type])} />}
              <span className="min-w-0 flex-1 truncate text-sm font-medium dark:text-slate-200">
                {tab.title}
              </span>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={cn(
                    "shrink-0 rounded-md p-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:hover:bg-slate-600",
                    theme.closeHover
                  )}>
                  <X className="h-3 w-3 dark:text-slate-300" />
                </button>
              )}
            </div>
          );
        })}

        {newTabButton}
      </div>

      {/* Right slot (e.g. NotificationBell) */}
      {rightSlot && <div className="flex h-full shrink-0 items-center gap-2 px-3">{rightSlot}</div>}
    </div>
  );
}
