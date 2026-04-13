import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export interface SidebarMenuItem {
  type: string;
  icon: React.ElementType;
  label: string;
  color: string;
  description?: string;
  children?: SidebarMenuItem[];
}

export interface SidebarMenuGroup {
  label?: string;
  items: SidebarMenuItem[];
}

export interface DashboardSidebarTheme {
  // Container
  wrapper: string;
  expandedWidth: string;
  // Toggle button
  toggleBtn: string;
  toggleIconColor: string;
  // Logo
  logoBorder: string;
  logoExpandedPadding: string;
  logoCollapsedPadding: string;
  // Navigation
  navWrapper: string;
  navExpandedPadding: string;
  navCollapsedPadding: string;
  sectionLabel: string;
  divider: string;
  // Menu items
  itemPy: string;
  activeItem: string;
  inactiveItem: string;
  activeIconOverride?: string;
  // Flyout submenu
  flyoutActiveItem?: string;
  flyoutInactiveItem?: string;
  flyoutActiveIcon?: string;
  flyoutBorder?: string;
  // Footer
  footerBorder: string;
  footerExpandedPadding: string;
  footerCollapsedPadding: string;
  themeToggleLabel: string;
  logoutExpandedBtn: string;
  logoutCollapsedBtn: string;
  logoutIcon: string;
  logoutLabel: string;
}

export interface DashboardSidebarProps {
  menuGroups: SidebarMenuGroup[];
  activeTab: string;
  onNavigate: (_type: string) => void;
  storageKey: string;
  legacyStorageKey?: string;
  logo: React.ReactNode;
  collapsedLogo?: React.ReactNode;
  showSettings?: boolean;
  settingsLabel?: string;
  settingsExpandedClass?: string;
  settingsCollapsedClass?: string;
  theme: DashboardSidebarTheme;
}

export function DashboardSidebar({
  menuGroups,
  activeTab,
  onNavigate,
  storageKey,
  legacyStorageKey,
  logo,
  collapsedLogo,
  showSettings = false,
  settingsLabel = "Settings",
  settingsExpandedClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
  settingsCollapsedClass = "flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
  theme,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isMobile = useIsMobile();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) return saved === "true";

    if (legacyStorageKey) {
      const legacy = localStorage.getItem(legacyStorageKey);
      if (legacy !== null) {
        localStorage.setItem(storageKey, legacy);
        localStorage.removeItem(legacyStorageKey);
        return legacy === "true";
      }
    }

    return false;
  });

  const desktopSidebarRef = useRef<HTMLElement | null>(null);

  const [hoveredDesktopParent, setHoveredDesktopParent] = useState<string | null>(null);
  const [pinnedDesktopParent, setPinnedDesktopParent] = useState<string | null>(null);
  const [collapsedDropdownParent, setCollapsedDropdownParent] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(() => {
    const saved = localStorage.getItem(`${storageKey}_mobile_expanded`);
    return saved || null;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed));
  }, [isCollapsed, storageKey]);

  useEffect(() => {
    if (expandedMobileItem) {
      localStorage.setItem(`${storageKey}_mobile_expanded`, expandedMobileItem);
      return;
    }

    localStorage.removeItem(`${storageKey}_mobile_expanded`);
  }, [expandedMobileItem, storageKey]);

  useEffect(() => {
    if (!isCollapsed || !collapsedDropdownParent) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!desktopSidebarRef.current?.contains(target)) {
        setCollapsedDropdownParent(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [collapsedDropdownParent, isCollapsed]);

  const toggleCollapse = () => {
    setHoveredDesktopParent(null);
    setCollapsedDropdownParent(null);
    setPinnedDesktopParent(null);
    setIsCollapsed((prev) => !prev);
  };

  const handleNavigate = (type: string) => {
    onNavigate(type);
    setCollapsedDropdownParent(null);
    setHoveredDesktopParent(null);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authManager.logout();
      clearAuth();
      setIsMobileOpen(false);
      toast.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      setIsMobileOpen(false);
      navigate("/login");
    }
  };

  const renderMenuItem = (item: SidebarMenuItem) => {
    // Items with children get flyout submenu handling
    if (item.children && item.children.length > 0) {
      return renderFlyoutItem(item);
    }

    const isActive = activeTab === item.type;
    const buttonContent = (
      <button
        key={item.type}
        onClick={() => handleNavigate(item.type)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          isCollapsed ? cn("justify-center px-2", theme.itemPy) : cn("px-3", theme.itemPy),
          isActive ? theme.activeItem : theme.inactiveItem
        )}>
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0",
            isActive && theme.activeIconOverride ? theme.activeIconOverride : item.color
          )}
        />
        {!isCollapsed && item.label}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.type}>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.description ? (
              <div>
                <p>{item.label}</p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            ) : (
              item.label
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  const renderFlyoutItem = (item: SidebarMenuItem) => {
    const isAnyChildActive = item.children!.some((c) => activeTab === c.type);
    const isActive = activeTab === item.type || isAnyChildActive;
    const isCollapsedDropdownOpen = collapsedDropdownParent === item.type;
    const isExpandedDropdownOpen =
      !isCollapsed &&
      (hoveredDesktopParent === item.type ||
        (!hoveredDesktopParent && (pinnedDesktopParent === item.type || isAnyChildActive)));

    return (
      <div
        key={item.type}
        className="relative"
        onMouseEnter={() => {
          if (!isCollapsed) {
            setHoveredDesktopParent(item.type);
          }
        }}
        onMouseLeave={() => {
          if (!isCollapsed) {
            setHoveredDesktopParent((prev) => (prev === item.type ? null : prev));
          }
        }}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isCollapsedDropdownOpen}
                onClick={() =>
                  setCollapsedDropdownParent((prev) => (prev === item.type ? null : item.type))
                }
                className={cn(
                  "flex w-full items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
                  theme.itemPy,
                  isActive ? theme.activeItem : theme.inactiveItem
                )}>
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive && theme.activeIconOverride ? theme.activeIconOverride : item.color
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isExpandedDropdownOpen}
            onClick={() =>
              setPinnedDesktopParent((prev) => (prev === item.type ? null : item.type))
            }
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              theme.itemPy,
              isActive ? theme.activeItem : theme.inactiveItem
            )}>
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0",
                isActive && theme.activeIconOverride ? theme.activeIconOverride : item.color
              )}
            />
            {item.label}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 opacity-70 transition-transform duration-200",
                isExpandedDropdownOpen && "rotate-180"
              )}
            />
          </button>
        )}

        {isCollapsed && isCollapsedDropdownOpen && item.children && (
          <div
            className={cn(
              "absolute top-0 left-[calc(100%+0.5rem)] z-70 min-w-52 rounded-xl border bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900",
              theme.flyoutBorder
            )}>
            <p className="px-2.5 pt-1 pb-1.5 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              {item.label}
            </p>

            {item.children.map((child) => {
              const isChildActive = activeTab === child.type;
              return (
                <button
                  key={child.type}
                  type="button"
                  onClick={() => handleNavigate(child.type)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                    isChildActive
                      ? theme.flyoutActiveItem || theme.activeItem
                      : theme.flyoutInactiveItem ||
                          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}>
                  <child.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isChildActive && theme.flyoutActiveIcon ? theme.flyoutActiveIcon : child.color
                    )}
                  />
                  <span className="truncate">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isCollapsed && isExpandedDropdownOpen && item.children && (
          <div className="mt-1 ml-6 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700/80">
            {item.children.map((child) => {
              const isChildActive = activeTab === child.type;
              return (
                <button
                  key={child.type}
                  type="button"
                  onClick={() => handleNavigate(child.type)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    isChildActive
                      ? theme.flyoutActiveItem || theme.activeItem
                      : theme.flyoutInactiveItem ||
                          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}>
                  <child.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isChildActive && theme.flyoutActiveIcon ? theme.flyoutActiveIcon : child.color
                    )}
                  />
                  <span className="truncate">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMobileMenuItem = (item: SidebarMenuItem) => {
    if (!item.children || item.children.length === 0) {
      const isActive = activeTab === item.type;
      return (
        <button
          key={item.type}
          onClick={() => handleNavigate(item.type)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-2xl border px-3.5 text-left text-sm font-semibold transition-all",
            "min-h-11 border-transparent",
            isActive
              ? "border-[#0047AB]/20 shadow-sm shadow-[#0047AB]/10 dark:border-[#66B2FF]/25 dark:shadow-[#66B2FF]/10"
              : "hover:border-slate-200/90 hover:shadow-[0_6px_16px_-14px_rgba(15,23,42,0.6)] dark:hover:border-slate-700/80 dark:hover:shadow-black/30",
            theme.itemPy,
            isActive ? theme.activeItem : theme.inactiveItem
          )}>
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0",
              isActive && theme.activeIconOverride ? theme.activeIconOverride : item.color
            )}
          />
          <span className="truncate">{item.label}</span>
        </button>
      );
    }

    const isAnyChildActive = item.children.some((child) => activeTab === child.type);
    const isExpanded = expandedMobileItem === item.type || isAnyChildActive;

    return (
      <div key={item.type} className="space-y-1">
        <button
          onClick={() =>
            setExpandedMobileItem((prev) => {
              if (prev === item.type) return null;
              return item.type;
            })
          }
          className={cn(
            "group flex w-full items-center gap-3 rounded-2xl border px-3.5 text-left text-sm font-semibold transition-all",
            "min-h-11 border-transparent",
            isAnyChildActive
              ? "border-[#0047AB]/20 shadow-sm shadow-[#0047AB]/10 dark:border-[#66B2FF]/25 dark:shadow-[#66B2FF]/10"
              : "hover:border-slate-200/90 hover:shadow-[0_6px_16px_-14px_rgba(15,23,42,0.6)] dark:hover:border-slate-700/80 dark:hover:shadow-black/30",
            theme.itemPy,
            isAnyChildActive ? theme.activeItem : theme.inactiveItem
          )}>
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0",
              isAnyChildActive && theme.activeIconOverride ? theme.activeIconOverride : item.color
            )}
          />
          <span className="truncate">{item.label}</span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ease-out",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        {isExpanded && (
          <div className="mt-1 ml-6 space-y-1 border-l border-slate-200/90 pl-3 dark:border-slate-700/90">
            {item.children.map((child) => {
              const isChildActive = activeTab === child.type;
              return (
                <button
                  key={child.type}
                  onClick={() => handleNavigate(child.type)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all",
                    "border-transparent",
                    isChildActive
                      ? "border-[#0047AB]/20 shadow-sm shadow-[#0047AB]/10 dark:border-[#66B2FF]/25 dark:shadow-[#66B2FF]/10"
                      : "hover:border-slate-200/80 dark:hover:border-slate-700/80",
                    isChildActive
                      ? theme.flyoutActiveItem || theme.activeItem
                      : theme.flyoutInactiveItem ||
                          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}>
                  <child.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isChildActive && theme.flyoutActiveIcon ? theme.flyoutActiveIcon : child.color
                    )}
                  />
                  <span className="truncate">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <>
        {isMobile && (
          <div className="fixed top-3 left-3 z-40 md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Mở menu điều hướng"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300/90 bg-white/95 shadow-md shadow-slate-300/50 transition-all hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40 dark:hover:bg-slate-800">
                  <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[83vw] max-w-[336px] p-0 sm:max-w-[352px]">
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-linear-to-b from-slate-100/95 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                  <div className="shrink-0 border-b border-slate-200/90 px-3.5 pt-[calc(0.9rem+env(safe-area-inset-top))] pb-3 dark:border-slate-800/90">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/85 bg-white/85 px-3 py-2 shadow-sm shadow-slate-300/30 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/30">
                      {logo}
                    </div>
                  </div>

                  <nav
                    className={cn(
                      theme.navWrapper,
                      "min-h-0 flex-1 overflow-y-auto px-2.5 pt-3 pb-4"
                    )}>
                    {menuGroups.map((group, groupIdx) => (
                      <div key={`mobile-group-${groupIdx}`} className="space-y-1">
                        {groupIdx > 0 && (
                          <>
                            {group.label ? (
                              <p
                                className={cn(
                                  "mt-5 mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] text-slate-500 dark:text-slate-400",
                                  theme.sectionLabel
                                )}>
                                {group.label}
                              </p>
                            ) : (
                              <div
                                className={cn(
                                  "my-4 border-t border-dashed",
                                  theme.divider,
                                  "dark:border-slate-700"
                                )}
                              />
                            )}
                          </>
                        )}
                        {groupIdx === 0 && group.label && (
                          <p
                            className={cn(
                              "mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] text-slate-500 dark:text-slate-400",
                              theme.sectionLabel
                            )}>
                            {group.label}
                          </p>
                        )}
                        {group.items.map(renderMobileMenuItem)}
                      </div>
                    ))}
                  </nav>

                  <div
                    className={cn(
                      theme.footerBorder,
                      "shrink-0 border-t border-slate-200/90 bg-slate-50/88 px-2.5 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/72"
                    )}>
                    <div className="mb-1.5 flex items-center justify-between rounded-2xl border border-slate-200/85 bg-white/82 px-3 py-2.5 shadow-sm shadow-slate-300/20 dark:border-slate-700/80 dark:bg-slate-900/52 dark:shadow-none">
                      <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                        {theme.themeToggleLabel}
                      </span>
                      <ThemeToggle iconOnly />
                    </div>
                    {showSettings && (
                      <button
                        className={cn(
                          settingsExpandedClass,
                          "rounded-2xl border border-transparent"
                        )}>
                        <Settings className="h-5 w-5" />
                        {settingsLabel}
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className={cn(
                        theme.logoutExpandedBtn,
                        "mt-1 rounded-2xl border border-transparent"
                      )}>
                      <LogOut className={cn("h-5 w-5", theme.logoutIcon)} />
                      <span>{theme.logoutLabel}</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        <aside
          ref={desktopSidebarRef}
          className={cn(
            "relative z-30 hidden flex-col overflow-visible transition-all duration-300 md:flex dark:border-slate-800 dark:bg-slate-900",
            isCollapsed ? "w-20" : theme.expandedWidth,
            theme.wrapper
          )}>
          {/* Collapse Toggle Button */}
          <button onClick={toggleCollapse} className={theme.toggleBtn}>
            {isCollapsed ? (
              <ChevronRight
                className={cn("h-4 w-4", theme.toggleIconColor, "dark:text-slate-400")}
              />
            ) : (
              <ChevronLeft
                className={cn("h-4 w-4", theme.toggleIconColor, "dark:text-slate-400")}
              />
            )}
          </button>

          {/* Logo */}
          <div
            className={cn(
              "flex items-center dark:border-slate-800",
              theme.logoBorder,
              isCollapsed ? theme.logoCollapsedPadding : theme.logoExpandedPadding
            )}>
            {isCollapsed && collapsedLogo ? collapsedLogo : logo}
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              theme.navWrapper,
              isCollapsed ? theme.navCollapsedPadding : theme.navExpandedPadding
            )}>
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                {groupIdx > 0 && (
                  <>
                    {!isCollapsed && group.label && (
                      <p className={cn("mt-4 mb-2", theme.sectionLabel)}>{group.label}</p>
                    )}
                    {isCollapsed && (
                      <div
                        className={cn("my-2 border-t", theme.divider, "dark:border-slate-700")}
                      />
                    )}
                    {!isCollapsed && !group.label && (
                      <div
                        className={cn("my-2 border-t", theme.divider, "dark:border-slate-700")}
                      />
                    )}
                  </>
                )}
                {groupIdx === 0 && !isCollapsed && group.label && (
                  <p className={cn("mb-2", theme.sectionLabel)}>{group.label}</p>
                )}
                {group.items.map(renderMenuItem)}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div
            className={cn(
              theme.footerBorder,
              "dark:border-slate-800",
              isCollapsed ? theme.footerCollapsedPadding : theme.footerExpandedPadding
            )}>
            {!isCollapsed ? (
              <>
                <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                    {theme.themeToggleLabel}
                  </span>
                  <ThemeToggle iconOnly />
                </div>
                {showSettings && (
                  <button className={settingsExpandedClass}>
                    <Settings className="h-5 w-5" />
                    {settingsLabel}
                  </button>
                )}
                <button onClick={handleLogout} className={theme.logoutExpandedBtn}>
                  <LogOut className={cn("h-5 w-5", theme.logoutIcon)} />
                  <span>{theme.logoutLabel}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ThemeToggle iconOnly />
                {showSettings && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={settingsCollapsedClass}>
                        <Settings className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{settingsLabel}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleLogout} className={theme.logoutCollapsedBtn}>
                      <LogOut className={cn("h-5 w-5", theme.logoutIcon)} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{theme.logoutLabel}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </aside>
      </>
    </TooltipProvider>
  );
}
