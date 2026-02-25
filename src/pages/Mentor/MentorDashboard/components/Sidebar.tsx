import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Star,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import type { TabType } from "./ChromeTabs";

interface SidebarProps {
  onNavigate: (type: TabType) => void;
  currentView?: TabType;
}

const SIDEBAR_COLLAPSED_KEY = "mentor_dashboard_sidebar_collapsed";

const MENU_ITEMS = [
  {
    type: "overview" as TabType,
    icon: LayoutDashboard,
    label: "Tổng quan",
    color: "text-emerald-600",
  },
  {
    type: "sessions" as TabType,
    icon: Calendar,
    label: "Phiên phỏng vấn",
    color: "text-blue-600",
  },
  {
    type: "students" as TabType,
    icon: Users,
    label: "Học viên",
    color: "text-purple-600",
  },
  {
    type: "reviews" as TabType,
    icon: Star,
    label: "Đánh giá",
    color: "text-yellow-600",
  },
  {
    type: "feedback" as TabType,
    icon: MessageSquare,
    label: "Phản hồi đã gửi",
    color: "text-cyan-600",
  },
  {
    type: "community" as TabType,
    icon: Newspaper,
    label: "Cộng đồng",
    color: "text-orange-500",
  },
];

const SECONDARY_MENU_ITEMS = [
  {
    type: "notifications" as TabType,
    icon: Bell,
    label: "Thông báo",
    color: "text-red-600",
  },
  {
    type: "account" as TabType,
    icon: User,
    label: "Tài khoản",
    color: "text-gray-600",
  },
];

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

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

  const renderMenuItem = (item: (typeof MENU_ITEMS)[0]) => {
    const buttonContent = (
      <button
        key={item.type}
        onClick={() => onNavigate(item.type)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          currentView === item.type
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        )}>
        <item.icon
          className={cn(
            "h-5 w-5 flex-shrink-0",
            currentView === item.type ? "text-emerald-600 dark:text-emerald-400" : item.color
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
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
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
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Cổng Mentor</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-1 overflow-y-auto py-4",
            isCollapsed ? "px-2" : "px-3"
          )}>
          {!isCollapsed && (
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-emerald-600/70 uppercase dark:text-slate-500">
              Nghiệp vụ
            </p>
          )}
          {MENU_ITEMS.map(renderMenuItem)}

          {!isCollapsed && (
            <p className="mt-4 mb-2 px-3 text-xs font-semibold tracking-wider text-emerald-600/70 uppercase dark:text-slate-500">
              Cá nhân
            </p>
          )}
          {isCollapsed && (
            <div className="my-2 border-t border-emerald-100 dark:border-slate-700" />
          )}
          {SECONDARY_MENU_ITEMS.map(renderMenuItem)}
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
