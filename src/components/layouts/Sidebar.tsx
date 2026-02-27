import {
  Bell,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileQuestion,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { ThemeToggle } from "@/components/ThemeToggle";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const SIDEBAR_COLLAPSED_KEY = "user_sidebar_collapsed";

type LeafMenuItem = {
  group?: false;
  label: string;
  icon: React.ElementType;
  path: string;
  exactMatch?: boolean;
};

type GroupMenuItem = {
  group: true;
  label: string;
  icon: React.ElementType;
  children: LeafMenuItem[];
};

type NavItem = LeafMenuItem | GroupMenuItem;

const menuItems: NavItem[] = [
  {
    label: "Tổng quan",
    icon: LayoutDashboard,
    path: "/dashboard",
    exactMatch: true,
  },
  {
    label: "Phỏng vấn với Mentor",
    icon: Users,
    path: "/dashboard/mock-interview",
    exactMatch: true,
  },
  {
    label: "Lịch sử phỏng vấn",
    icon: History,
    path: "/dashboard/mock-interview/history",
  },
  {
    label: "Phản hồi từ Mentor",
    icon: MessageSquare,
    path: "/dashboard/feedback",
  },
  {
    label: "Phỏng vấn với AI",
    icon: Bot,
    path: "/dashboard/ai-interview",
  },
  {
    label: "AI Chat",
    icon: MessageSquare,
    path: "/dashboard/ai-chat",
  },
  {
    label: "Bộ câu hỏi",
    icon: CircleHelp,
    path: "/dashboard/questions",
  },
  {
    group: true,
    label: "Luyện tập",
    icon: GraduationCap,
    children: [
      {
        label: "Bộ luyện tập",
        icon: GraduationCap,
        path: "/dashboard/practice",
        exactMatch: true,
      },
      {
        label: "Câu hỏi luyện tập",
        icon: FileQuestion,
        path: "/dashboard/practice/questions",
      },
    ],
  },
  {
    label: "Cộng đồng",
    icon: Newspaper,
    path: "/dashboard/community",
  },
  {
    label: "Thông báo",
    icon: Bell,
    path: "/dashboard/notifications",
  },
  {
    label: "Tài khoản",
    icon: User,
    path: "/dashboard/account",
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Collapsible state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Fixed isActive logic - exact match for dashboard root
  const isActive = (path: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLogout = async () => {
    try {
      await authManager.logout();
      clearAuth();
      toast.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      navigate("/login");
    }
  };

  const renderLeafItem = (item: LeafMenuItem) => {
    const Icon = item.icon;
    const active = isActive(item.path, item.exactMatch);

    const linkContent = (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
          isCollapsed ? "justify-center px-2" : "px-3",
          active
            ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        )}>
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            active ? "text-[#0047AB] dark:text-[#66B2FF]" : "text-slate-500 dark:text-slate-400"
          )}
        />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const renderGroupItem = (item: GroupMenuItem) => {
    const Icon = item.icon;
    const anyChildActive = item.children.some((c) => isActive(c.path, c.exactMatch));

    // Collapsed: HoverCard flyout to the right (portal-based, escapes overflow)
    if (isCollapsed) {
      return (
        <HoverCard key={item.label} openDelay={0} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div
              role="button"
              aria-label={item.label}
              className={cn(
                "flex cursor-default items-center justify-center rounded-lg px-2 py-2.5 transition-colors",
                anyChildActive
                  ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}>
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  anyChildActive
                    ? "text-[#0047AB] dark:text-[#66B2FF]"
                    : "text-slate-500 dark:text-slate-400"
                )}
              />
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-48 p-1.5 shadow-lg">
            <p className="mb-1 px-2 py-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {item.label}
            </p>
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const active = isActive(child.path, child.exactMatch);
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}>
                  <ChildIcon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? "text-[#0047AB] dark:text-[#66B2FF]"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  />
                  {child.label}
                </Link>
              );
            })}
          </HoverCardContent>
        </HoverCard>
      );
    }

    // Expanded: CSS group-hover dropdown with grid-rows animation
    return (
      <div key={item.label} className="group/nav">
        {/* Parent trigger — no navigation */}
        <div
          className={cn(
            "flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors select-none",
            anyChildActive
              ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          )}>
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              anyChildActive
                ? "text-[#0047AB] dark:text-[#66B2FF]"
                : "text-slate-500 dark:text-slate-400"
            )}
          />
          <span className="flex-1">{item.label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              anyChildActive
                ? "text-[#0047AB] dark:text-[#66B2FF]"
                : "text-slate-400 dark:text-slate-500",
              "group-hover/nav:rotate-180"
            )}
          />
        </div>

        {/* Submenu — animates open on hover */}
        <div className="grid grid-rows-[0fr] transition-all duration-200 group-hover/nav:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="mt-0.5 flex flex-col gap-0.5 pb-0.5 pl-3">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const active = isActive(child.path, child.exactMatch);
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    )}>
                    <ChildIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-[#0047AB] dark:text-[#66B2FF]"
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative sticky top-0 flex h-screen flex-shrink-0 flex-col border-r border-slate-100 bg-slate-50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900",
          isCollapsed ? "w-20" : "w-72"
        )}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-slate-100 dark:border-slate-800",
            isCollapsed ? "justify-center px-2" : "px-6"
          )}>
          <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-lg font-bold text-[#002654] dark:text-white">INBLUE AI</span>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-1 overflow-y-auto py-4",
            isCollapsed ? "px-2" : "px-3"
          )}>
          {menuItems.map((item) => (item.group ? renderGroupItem(item) : renderLeafItem(item)))}
        </nav>

        {/* Theme Toggle & Logout */}
        <div
          className={cn(
            "border-t border-slate-100 dark:border-slate-800",
            isCollapsed ? "p-2" : "p-3"
          )}>
          {!isCollapsed && (
            <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Giao diện
              </span>
              <ThemeToggle iconOnly />
            </div>
          )}

          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <ThemeToggle iconOnly />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                    <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
