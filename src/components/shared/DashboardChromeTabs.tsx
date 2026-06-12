import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onCloseOtherTabs?: (tabId: string) => void;
  onCloseAllTabs?: () => void;
  onNewTab: (type: string) => void;
  leftSlot?: React.ReactNode;
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
  onCloseOtherTabs,
  onCloseAllTabs,
  onNewTab,
  leftSlot,
  rightSlot,
  tabIcons,
  tabColors,
  menuGroups,
  menuActions,
  compact = false,
  theme,
}: DashboardChromeTabsProps) {
  const { t } = useTranslation();
  const [showNewTabMenu, setShowNewTabMenu] = useState(false);
  const [newTabMenuPosition, setNewTabMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  const newTabButtonRef = useRef<HTMLButtonElement>(null);
  const newTabMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    window.addEventListener("contextmenu", handleClose);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("contextmenu", handleClose);
    };
  }, [contextMenu]);
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
    <div
      data-testid="chrome-tabs-new-tab"
      className={cn(
        "shrink-0",
        !compact &&
          "sticky right-0 z-20 ml-1 flex items-center bg-linear-to-l from-white/95 via-white/95 to-transparent pl-2 dark:from-slate-900/95 dark:via-slate-900/95",
        showNewTabMenu && "z-80"
      )}>
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
        aria-label={t("compShared.openTheTabMenu")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl border border-transparent transition-colors dark:bg-slate-700 dark:hover:bg-slate-600",
          theme.addBtnBg,
          theme.addBtnHover
        )}>
        <Plus className="h-4 w-4 dark:text-slate-300" />
      </button>

      {showNewTabMenu && (
        <>
          <div className="fixed inset-0 z-80" onClick={closeNewTabMenu} />
          <div
            ref={newTabMenuRef}
            style={{
              top: newTabMenuPosition?.top ?? 0,
              left: newTabMenuPosition?.left ?? 0,
              visibility: newTabMenuPosition ? "visible" : "hidden",
            }}
            className={cn(
              "fixed z-90 rounded-lg border bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800",
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
          "relative z-60 flex h-14 items-end gap-1.5 border-b pr-2 pb-0 pl-16 md:z-auto md:px-2 dark:border-slate-800 dark:bg-slate-900",
          theme.bg
        )}>
        {leftSlot && <div className="hidden h-9 shrink-0 items-center md:flex">{leftSlot}</div>}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                show: true,
                x: e.clientX,
                y: e.clientY,
                tabId: tab.id,
              });
            }}
            className={cn(
              "group flex h-9 cursor-pointer items-center gap-2 rounded-t-xl border-x border-t px-3.5 text-sm transition-colors duration-200",
              tab.id === activeTabId
                ? cn(
                    theme.tabActiveBorder,
                    theme.tabActiveBg,
                    theme.tabActiveText,
                    "shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  )
                : cn(
                    "border-transparent",
                    theme.tabInactiveBg,
                    theme.tabInactiveText,
                    theme.tabInactiveHover,
                    "dark:bg-slate-950/40 dark:hover:bg-slate-800/30"
                  )
            )}>
            <span
              className={cn(
                "max-w-32 truncate transition-colors duration-200",
                tab.id === activeTabId
                  ? "font-semibold text-slate-900 dark:text-white"
                  : "font-medium text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
              )}>
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
        "relative z-60 flex h-14 items-end border-b md:z-auto dark:border-slate-800 dark:bg-slate-900",
        theme.bg
      )}>
      {leftSlot && (
        <div className="hidden h-full shrink-0 items-center pl-2 md:flex">{leftSlot}</div>
      )}

      {/* Tab List */}
      <div
        data-testid="chrome-tabs-full-strip"
        className="relative flex h-full min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-visible scroll-smooth pr-1 pb-0 pl-16 md:px-2">
        {tabs.map((tab) => {
          const Icon = tabIcons?.[tab.type];
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              style={{ width: dynamicTabWidth }}
              onClick={() => onTabSelect(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  show: true,
                  x: e.clientX,
                  y: e.clientY,
                  tabId: tab.id,
                });
              }}
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
                      "dark:bg-slate-950/40 dark:hover:bg-slate-800/30"
                    )
              )}>
              {Icon && <Icon className={cn("h-4 w-4 shrink-0", tabColors?.[tab.type])} />}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm transition-colors duration-200",
                  isActive
                    ? "font-semibold text-slate-900 dark:text-white"
                    : "font-medium text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
                )}>
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

      {/* Tab Context Menu */}
      {contextMenu && contextMenu.show && (
        <div
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          className="fixed z-[100] w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-md dark:border-slate-700 dark:bg-slate-800"
          onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={tabs.length <= 1}
            onClick={() => {
              onTabClose(contextMenu.tabId);
              setContextMenu(null);
            }}
            className={cn(
              "flex w-full items-center px-3 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-700",
              theme.menuHover
            )}>
            {t("common.closeThisTab")}
          </button>
          <button
            type="button"
            disabled={tabs.length <= 1}
            onClick={() => {
              if (onCloseOtherTabs) {
                onCloseOtherTabs(contextMenu.tabId);
              } else {
                tabs.forEach((t) => {
                  if (t.id !== contextMenu.tabId) {
                    onTabClose(t.id);
                  }
                });
              }
              setContextMenu(null);
            }}
            className={cn(
              "flex w-full items-center px-3 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-700",
              theme.menuHover
            )}>
            {t("common.closeOtherTabs")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCloseAllTabs) {
                onCloseAllTabs();
              } else {
                tabs.forEach((t, idx) => {
                  if (idx > 0) {
                    onTabClose(t.id);
                  }
                });
              }
              setContextMenu(null);
            }}
            className={cn(
              "flex w-full items-center px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700",
              theme.menuHover
            )}>
            {t("common.closeAllTabs")}
          </button>
        </div>
      )}
    </div>
  );
}
