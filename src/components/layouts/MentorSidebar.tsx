import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Star,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const SIDEBAR_COLLAPSED_KEY = "mentor_sidebar_collapsed";

const menuItems = [
  {
    label: "Tổng quan",
    icon: LayoutDashboard,
    path: "/mentor",
    exactMatch: true,
  },
  {
    label: "Phiên phỏng vấn",
    icon: Calendar,
    path: "/mentor/sessions",
  },
  {
    label: "Học viên",
    icon: Users,
    path: "/mentor/students",
  },
  {
    label: "Đánh giá",
    icon: Star,
    path: "/mentor/reviews",
  },
  {
    label: "Cộng đồng",
    icon: Newspaper,
    path: "/mentor/community",
  },
  {
    label: "Thông báo",
    icon: Bell,
    path: "/mentor/notifications",
  },
  {
    label: "Tài khoản",
    icon: User,
    path: "/mentor/account",
  },
];

export function MentorSidebar() {
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

  // Fixed isActive logic - exact match for dashboard root, prefix match for subpaths
  // Ensures /mentor doesn't match /mentor-register by requiring exact match or slash-separated path
  const isActive = (path: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return location.pathname === path;
    }
    // Match exact path or path followed by "/"
    // This prevents /mentor from matching /mentor-register
    return (
      location.pathname === path ||
      (location.pathname.startsWith(path) && location.pathname[path.length] === "/")
    );
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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r border-emerald-100 bg-emerald-50/50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900",
          isCollapsed ? "w-20" : "w-72"
        )}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm transition-colors hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-emerald-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-emerald-600 dark:text-slate-400" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-emerald-100 dark:border-slate-800",
            isCollapsed ? "justify-center px-2" : "px-6"
          )}>
          <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-700 dark:text-white">INBLUE AI</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Mentor Portal</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-1 overflow-y-auto py-4",
            isCollapsed ? "px-2" : "px-3"
          )}>
          {menuItems.map((item) => {
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
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                )}>
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
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
          })}
        </nav>

        {/* Theme Toggle & Logout */}
        <div
          className={cn(
            "border-t border-emerald-100 dark:border-slate-800",
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
                    className="flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                    <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
